import type { Svg } from ".svg";
import archiveIcon from "../assets/main-theme/icons/archive.svg";
import audioIcon from "../assets/main-theme/icons/audio.svg";
import binaryIcon from "../assets/main-theme/icons/binary.svg";
import directoryIcon from "../assets/main-theme/icons/directory.svg";
import document from "../assets/main-theme/icons/document.svg";
import genericFileIcon from "../assets/main-theme/icons/generic-file.svg";
import imageIcon from "../assets/main-theme/icons/image.svg";
import pdfIcon from "../assets/main-theme/icons/pdf.svg";
import script from "../assets/main-theme/icons/script.svg";
import textFileIcon from "../assets/main-theme/icons/text-file.svg";
import videoIcon from "../assets/main-theme/icons/video.svg";

import { FStat } from "../filesystem-interface";

const IconToExtMap: Array<[Svg, string[]]> = [
  [archiveIcon, [".zip", ".tar", ".gz", ".bz2", ".xz", ".7z"]],
  [audioIcon, [".mp3", ".wav", ".flac", ".ogg", ".m4a", ".wma"]],
  [binaryIcon, [".exe", ".dll", ".so", ".dylib", ".bin"]],
  [document, [".doc", ".docx", ".odt", ".pdf", ".rtf", ".tex"]],
  [imageIcon, [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".ico"]],
  [pdfIcon, [".pdf"]],
  [
    script,
    [
      ".sh",
      ".bat",
      ".cmd",
      ".ps1",
      ".vbs",
      ".py",
      ".js",
      ".ts",
      ".c",
      ".cpp",
      ".cs",
      ".java",
      ".php",
      ".html",
      ".css",
    ],
  ],
  [
    textFileIcon,
    [
      ".txt",
      ".md",
      ".markdown",
      ".nfo",
      ".log",
      ".json",
      ".xml",
      ".yml",
      ".yaml",
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
];

const IconToDirnameMap: Array<[Svg, string[]]> = [[directoryIcon, [""]]];

export function getFileIcon(file: FStat): Svg {
  if (file.directory) {
    for (let i = 0; i < IconToDirnameMap.length; i++) {
      if (IconToDirnameMap[i]![1].includes(file.name.toLowerCase())) {
        return IconToDirnameMap[i]![0];
      }
    }

    return directoryIcon;
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
