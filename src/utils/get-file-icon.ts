import type { Svg } from ".svg";
import archiveIcon from "../assets/main-theme/icons/archive.svg";
import audioIcon from "../assets/main-theme/icons/audio.svg";
import binaryIcon from "../assets/main-theme/icons/binary.svg";
import clangIcon from "../assets/main-theme/icons/clang.svg";
import cssIcon from "../assets/main-theme/icons/css.svg";
import directoryIcon from "../assets/main-theme/icons/directory.svg";
import document from "../assets/main-theme/icons/document.svg";
import genericFileIcon from "../assets/main-theme/icons/generic-file.svg";
import golangIcon from "../assets/main-theme/icons/go.svg";
import htmlIcon from "../assets/main-theme/icons/html.svg";
import imageIcon from "../assets/main-theme/icons/image.svg";
import javaIcon from "../assets/main-theme/icons/java.svg";
import jsIcon from "../assets/main-theme/icons/js.svg";
import jsonIcon from "../assets/main-theme/icons/json.svg";
import markdownIcon from "../assets/main-theme/icons/markdown.svg";
import pdfIcon from "../assets/main-theme/icons/pdf.svg";
import pythonIcon from "../assets/main-theme/icons/python.svg";
import rustIcon from "../assets/main-theme/icons/rust.svg";
import script from "../assets/main-theme/icons/script.svg";
import textFileIcon from "../assets/main-theme/icons/text-file.svg";
import tsIcon from "../assets/main-theme/icons/ts.svg";
import videoIcon from "../assets/main-theme/icons/video.svg";
import yamlIcon from "../assets/main-theme/icons/yaml.svg";
import { FStat } from "../filesystem-interface";

export function getFileIcon(file: FStat): Svg {
  if (file.directory) {
    for (let i = 0; i < IconToDirnameMap.length; i++) {
      if (IconToDirnameMap[i]![1].includes(file.name.toLowerCase())) {
        return IconToDirnameMap[i]![0];
      }
    }

    return directoryIcon;
  }

  if (file.mimetype != null && file.mimetype !== "") {
    let mimetype = file.mimetype.toLowerCase();
    if (mimetype.includes(";")) {
      mimetype = mimetype.split(";")[0]!;
    }
    for (let i = 0; i < IconToMimetypeMap.length; i++) {
      if (IconToMimetypeMap[i]![1].includes(mimetype)) {
        return IconToMimetypeMap[i]![0];
      }
    }
  }

  const ext = extractExt(file.name).toLowerCase();
  for (let i = 0; i < IconToExtMap.length; i++) {
    if (IconToExtMap[i]![1].includes(ext)) {
      return IconToExtMap[i]![0];
    }
  }

  return genericFileIcon;
}

function extractExt(name: string) {
  let ext = "";
  let hasExt = false;
  for (let i = name.length - 1; i >= 0; i--) {
    if (name[i] === ".") {
      hasExt = true;
      ext = "." + ext;
      break;
    }
    ext = name[i] + ext;
  }
  if (!hasExt) {
    return "";
  }
  return ext;
}

const IconToExtMap: Array<[Svg, string[]]> = [
  [archiveIcon, [".zip", ".tar", ".gz", ".bz2", ".xz", ".7z"]],
  [audioIcon, [".mp3", ".wav", ".flac", ".ogg", ".m4a", ".wma"]],
  [binaryIcon, [".exe", ".dll", ".so", ".dylib", ".bin"]],
  [document, [".doc", ".docx", ".odt", ".pdf", ".rtf", ".tex"]],
  [imageIcon, [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".svg",
    ".ico",
    ".webp",
  ]],
  [pdfIcon, [".pdf"]],
  [
    script,
    [
      ".sh",
      ".bat",
      ".cmd",
      ".ps1",
      ".vbs",
      ".cs",
      ".php",
    ],
  ],
  [
    textFileIcon,
    [
      ".txt",
      ".nfo",
      ".log",
      ".xml",
      ".csv",
      ".tsv",
    ],
  ],
  [
    videoIcon,
    [
      ".mp4",
      ".mkv",
      ".avi",
      ".mov",
      ".flv",
      ".wmv",
      ".webm",
      ".mpg",
      ".mpeg",
      ".m4v",
      ".3gp",
      ".3g2",
    ],
  ],
  [clangIcon, [".c", ".cpp"]],
  [cssIcon, [".css", ".scss", ".sass", ".less"]],
  [golangIcon, [".go"]],
  [htmlIcon, [".html", ".htm"]],
  [javaIcon, [".java", ".jar"]],
  [jsIcon, [".js", ".mjs", ".cjs", ".jsx", ".mjsx", ".cjsx"]],
  [jsonIcon, [".json"]],
  [markdownIcon, [".md", ".markdown"]],
  [pythonIcon, [".py"]],
  [rustIcon, [".rs"]],
  [tsIcon, [".ts", ".mts", ".cts", ".tsx", ".mtsx", ".ctsx"]],
  [yamlIcon, [".yaml", ".yml"]],
];

const IconToMimetypeMap: Array<[Svg, string[]]> = [
  [archiveIcon, [
    "application/zip",
    "application/x-tar",
    "application/x-gzip",
    "application/x-bzip2",
    "application/x-xz",
    "application/x-7z-compressed",
  ]],
  [audioIcon, [
    "audio/mpeg",
    "audio/wav",
    "audio/flac",
    "audio/ogg",
    "audio/x-m4a",
    "audio/x-ms-wma",
    "audio/x-aac",
    "audio/x-mp3",
    "audio/x-wav",
    "audio/x-flac",
    "audio/x-ogg",
    "audio/x-m4a",
    "audio/x-ms-wma",
  ]],
  [binaryIcon, [
    "application/x-msdownload",
    "application/octet-stream",
    "application/x-executable",
    "application/x-sharedlib",
    "application/x-dosexec",
    "application/x-unix-binary",
    "application/x-apple-diskimage",
    "application/x-debian-package",
    "application/x-redhat-package-manager",
    "application/x-rpm",
    "application/x-ms-dos-executable",
    "application/x-dosexec",
    "application/x-executable",
    "application/x-sharedlib",
    "application/x-object",
    "application/x-bytecode.python",
  ]],
  [document, [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "application/rtf",
    "application/x-tex",
  ]],
  [imageIcon, [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/svg+xml",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/x-ico",
    "image/x-icon",
  ]],
  [pdfIcon, ["application/pdf"]],
  [script, [
    "application/x-sh",
    "application/x-shellscript",
    "application/x-bat",
    "application/x-cmd",
    "application/x-powershell",
    "application/x-vbs",
    "application/x-csharp",
    "application/x-php",
  ]],
  [textFileIcon, [
    "text/plain",
  ]],
  [videoIcon, [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/x-ms-asf",
    "video/x-ms-wm",
    "video/x-ms-wmx",
    "video/x-ms-wvx",
    "video/x-ms-wmz",
    "video/x-ms-wvx",
    "video/x-ms-wmx",
  ]],
  [yamlIcon, [
    "application/x-yaml",
    "text/yaml",
    "text/x-yaml",
  ]],
  [tsIcon, [
    "application/typescript",
    "application/x-typescript",
    "application/x-tiled-tsx",
    "text/typescript",
    "text/x-typescript",
  ]],
  [jsonIcon, [
    "application/json",
    "application/x-json",
    "text/json",
    "text/x-json",
  ]],
  [htmlIcon, [
    "text/html",
    "application/xhtml+xml",
  ]],
  [cssIcon, [
    "text/css",
  ]],
  [jsIcon, [
    "application/javascript",
    "application/x-javascript",
    "application/x-tiled-jsx",
    "text/javascript",
    "text/x-javascript",
    "text/ecmascript",
    "text/jscript",
    "text/livescript",
  ]],
  [markdownIcon, [
    "text/markdown",
    "text/x-markdown",
  ]],
];

const IconToDirnameMap: Array<[Svg, string[]]> = [[directoryIcon, [""]]];
