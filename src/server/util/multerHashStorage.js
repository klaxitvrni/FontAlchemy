const fs = require("fs");
const crypto = require("crypto");
const { PassThrough } = require("stream");

function splitStream(stream) {
  const s1 = new PassThrough(),
    s2 = new PassThrough();

  stream.on("data", (data) => {
    s1.write(data);
    s2.write(data);
  });
  stream.on("end", () => {
    s1.end();
    s2.end();
  });
  return [s1, s2];
}

class HashedStorage {
  constructor({ destination }) {
    this.destination = destination;
  }

  getDestination(readStream, file, cb) {
    const parts = file.originalname.split("."),
      ext = parts[parts.length - 1],
      hash = crypto.createHash("sha1");
    hash.setEncoding("hex");

    hash.on("error", (err) => cb(err));
    hash.on("finish", () => {
      const sha1 = hash.read();
      fs.mkdirSync(`${this.destination}/${sha1}`, { recursive: true });
      cb(null, `${this.destination}/${sha1}/${parts[0]}.${ext}`, sha1);
    });

    readStream.pipe(hash);
  }

  _handleFile(req, file, cb) {
    const [fileHashSource, writeSource] = splitStream(file.stream);

    this.getDestination(fileHashSource, file, function (err, path, hash) {
      if (err) return cb(err);

      const outStream = fs.createWriteStream(path);

      writeSource.pipe(outStream);
      outStream.on("error", cb);
      outStream.on("finish", function () {
        cb(null, {
          path,
          hash,
          size: outStream.bytesWritten,
        });
      });
    });
  }

  _removeFile(req, file, cb) {
    fs.unlink(file.path, cb);
  }
}

module.exports = HashedStorage;
