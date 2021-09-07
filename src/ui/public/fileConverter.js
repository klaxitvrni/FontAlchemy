const fileSelect = document.getElementById("fileSelect"),
  fileElem = document.getElementById("fileElem"),
  fileList = document.getElementById("fileList"),
  fileSize = document.getElementById("fileSize"),
  iframe = document.getElementById("iFrame");

const PREVIEW_FILE_HEIGHT = 200;
const PREVIEW_FILE_WIDTH = 300;

fileElem && fileElem.files && fileElem.files.length === 0 && (iframe.src = "");

fileElem.addEventListener("change", handleFiles, false);

function handleFiles() {
  fileElem &&
    fileElem.files &&
    fileElem.files.length === 0 &&
    (iframe.src = "");
  if (!this.files.length) {
    fileList.innerHTML = "<p>No files selected!</p>";
    fileSize.innerHTML = "";
  } else {
    const selectedFile = this.files[0];
    const selectedFileSize = selectedFile.size;
    const imgSrc = URL.createObjectURL(selectedFile);
    fileList.innerHTML = `<img src=${imgSrc} height="${PREVIEW_FILE_HEIGHT}" width="${PREVIEW_FILE_WIDTH}"></img>`;
    fileSize.innerHTML = `${selectedFileSize} bytes`;
  }
}

async function FileUpload() {
  const file = fileElem.files[0];
  let formData = new FormData();
  formData.append("svgIcon", file);
  let response = await fetch("/uploadIcon", {
    method: "POST",
    body: formData,
  });

  let result = await response.json();
  iframe.src = `./out/${result.hash}/vrni-icon.html`;
}
