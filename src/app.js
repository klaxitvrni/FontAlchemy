const express = require("express");
const path = require("path");
const multer = require("multer");
const generateFonts = require("fantasticon");
const fs = require("fs");
const HashedStorage = require("./server/util/multerHashStorage");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const rimraf = require("rimraf");

const app = express();

const PORT = process.env.PORT || 7000;
const UPLOAD_FOLDER_PATH = "src/ui/public/uploads";
const UI_PUBLIC_FOLDER = "src/ui/public";
const OUTPUT_FOLDER = "src/ui/public/out";
const INPUT_ATTR = "svgIcon";
const FA_HTML_TEMPLATE_PATH = "src/server/templates/html.hbs";
const FILES_CLEANUP_TIME_DURATION = 3600000;

const fantasticonOptions = {
  inputDir: UPLOAD_FOLDER_PATH,
  outputDir: OUTPUT_FOLDER,
  prefix: "vrni-icon",
  name: "vrni-icon",
  normalize: true,
  templates: {
    html: FA_HTML_TEMPLATE_PATH,
  },
};

// Define the maximum size for uploading
// picture i.e. 10 MB
const maxSize = 10 * 1000 * 1000;

// View Setup
app.use(express.static(UI_PUBLIC_FOLDER));
app.use(bodyParser.json());

// const upload = multer({ dest: "Upload_folder_name" })
// If you do not want to use diskStorage then uncomment it

const storage = new HashedStorage({
  destination: UPLOAD_FOLDER_PATH,
});

const upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    // Set the filetypes, it is optional
    const filetypes = /svg/;
    const mimetype = filetypes.test(file.mimetype);

    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(
      "Error: File upload only supports the " +
        "following filetypes - " +
        filetypes
    );
  },

  // name of file attribute
}).single(INPUT_ATTR);

app.post("/uploadIcon", function (req, res, next) {
  // Error MiddleWare for multer file upload, so if any
  // error occurs, the image would not be uploaded!
  upload(req, res, async function (err) {
    if (err) {
      console.log("Error:", err);

      // ERROR occured (here it can be occured due
      // to uploading image of size greater than
      // 1MB or uploading different file type)
      res.send(err);
    } else {
      // SUCCESS, image successfully uploaded

      try {
        const hash = req.file.hash || "";
        // Make sure out directory is present
        fs.mkdirSync(`${OUTPUT_FOLDER}/${hash}`, { recursive: true });
        const newOptions = {
          ...fantasticonOptions,
          outputDir: `${OUTPUT_FOLDER}/${hash}`,
          inputDir: `${UPLOAD_FOLDER_PATH}/${hash}`,
        };
        const result = await generateFonts.generateFonts(newOptions);
      } catch (e) {
        console.log("Error:", e);
      }
      console.log("Success!");

      res.send({
        message: "Successfully generated the icon",
        hash: req.file.hash || "",
      });
    }
  });
});

/**
 * Convert SVG text to Fantasticon Icon
 */
app.post("/convertSvgText", async function (req, res, next) {
  const svgText = req.body.svgText;
  const hash = crypto
    .createHash("md5")
    .update(svgText || "")
    .digest("hex");
  // Make sure out directory is present
  fs.mkdirSync(`${UPLOAD_FOLDER_PATH}/${hash}`, { recursive: true });
  fs.mkdirSync(`${OUTPUT_FOLDER}/${hash}`, { recursive: true });
  const newOptions = {
    ...fantasticonOptions,
    outputDir: `${OUTPUT_FOLDER}/${hash}`,
    inputDir: `${UPLOAD_FOLDER_PATH}/${hash}`,
  };
  fs.writeFile(
    `${UPLOAD_FOLDER_PATH}/${hash}/${hash}.svg`,
    svgText,
    async (err) => {
      if (err) {
        console.log("Error occurred while converting SVG Text to FontIcon:", err);
        throw err;
      }
      try {
        const result = await generateFonts.generateFonts(newOptions);
      } catch (e) {
        console.log("Error:", e);
      }
      console.log("Success!");

      res.send({
        message: "Successfully generated the icon",
        hash: hash || "",
      });
    }
  );
});

const cleanup = function (err, files, dir) {
  files.forEach(function (file, index) {
    fs.stat(path.join(dir, file), function (err, stat) {
      var endTime, now;
      if (err) {
        return console.error(err);
      }
      now = new Date().getTime();
      endTime = new Date(stat.ctime).getTime() + FILES_CLEANUP_TIME_DURATION;
      if (now > endTime) {
        return rimraf(path.join(dir, file), function (err) {
          if (err) {
            return console.error(err);
          }
        });
      }
    });
  });
};

// For directory cleanup exposing one API
// Delete all files older than an hour
app.delete("/cleanup", function (req, res, next) {
  try {
    fs.readdir(UPLOAD_FOLDER_PATH, (err, files) =>
      cleanup(err, files, UPLOAD_FOLDER_PATH)
    );
    fs.readdir(OUTPUT_FOLDER, (err, files) =>
      cleanup(err, files, OUTPUT_FOLDER)
    );
    res.send({
      message: "Successfully deleted the files older than 1 hour",
    });
  } catch (e) {
    res.send({
      message: "Failed to delete the files older than 1 hour",
    });
  }
});

// Take any port number of your choice which
// is not taken by any other process
app.listen(PORT, function (error) {
  if (error) throw error;
  console.log(`Server created Successfully on PORT ${PORT}`);
});
