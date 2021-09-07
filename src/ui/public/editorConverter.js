// Initial data
const HTML_CODE = `<?xml version="1.0" encoding="utf-8"?>
    <!-- Generator: Adobe Illustrator 21.1.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 30 30" style="enable-background:new 0 0 30 30;" xml:space="preserve">
    <path d="M23.1,10.2l-3.5-3.5c-0.2-0.2-0.6-0.2-0.8,0L7.6,17.9c-0.1,0.1-0.2,0.2-0.2,0.4L7.2,22c0,0.2,0,0.3,0.2,0.4
       c0.1,0.1,0.2,0.2,0.4,0.2l3.8-0.2c0.1,0,0.3-0.1,0.4-0.2L23.1,11c0.1-0.1,0.2-0.2,0.2-0.4S23.2,10.3,23.1,10.2z M11.3,21.3l-1.5,0.1
       c0-0.3-0.2-0.6-0.4-0.9c-0.2-0.3-0.6-0.4-0.9-0.5l0.1-1.5l8.9-8.9l1,1l-8.4,8.4c-0.2,0.2-0.2,0.6,0,0.8c0.1,0.1,0.2,0.2,0.4,0.2
       c0.1,0,0.3-0.1,0.4-0.2l8.4-8.4l1,1L11.3,21.3z M20.9,11.6l-2.8-2.8l1-1l2.8,2.8L20.9,11.6z"/>
    </svg>
    
    `;

let editor;

// Elements
const editorCode = document.getElementById("editorCode");
const editorPreview =
  document.getElementById("editorPreview").contentWindow.document;
const editorCopyButton = document.getElementById("editorCopyClipboard");
const fontIconPreview = document.getElementById("fontIconPreview");

// Monaco loader
require.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor/min/vs" },
});

window.MonacoEnvironment = {
  getWorkerUrl: function (workerId, label) {
    return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
            self.MonacoEnvironment = {
              baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor/min/'
            };
            importScripts('https://cdn.jsdelivr.net/npm/monaco-editor/min/vs/base/worker/workerMain.js');`)}`;
  },
};

// Monaco init
require(["vs/editor/editor.main"], function () {
  createEditor(editorCode);
});

function createEditor(editorContainer) {
  editor = monaco.editor.create(editorContainer, {
    value: HTML_CODE,
    language: "html",
    minimap: { enabled: false },
    automaticLayout: false,
    contextmenu: true,
    fontSize: 12,
    scrollbar: {
      useShadows: true,
      vertical: "visible",
      horizontal: "visible",
      horizontalScrollbarSize: 8,
      verticalScrollbarSize: 8,
    },
  });

  editorPreview.body.innerHTML = HTML_CODE;

  editor.onDidChangeModelContent(() => {
    editorPreview.body.innerHTML = editor.getValue();
  });
}

async function SvgTextToFontIcon() {
  const svgText = editor.getValue();
  let formData = new FormData();
  formData.append("svgText", svgText);
  let response = await fetch("/convertSvgText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ svgText: svgText }),
  });

  let result = await response.json();
  fontIconPreview.src = `./out/${result.hash}/vrni-icon.html`;
}
