export function mimeName(mimetype: string): string | undefined {
  const mime = mimetype.split("/")[0];
  if (mime) {
    switch (mime) {
      case "application":
        return applicationMimeName(mimetype);
      case "audio":
        return "Audio File";
      case "font":
        return "Font File";
      case "image":
        return "Image File";
      case "model":
        return "3D Model File";
      case "text":
        return "Text File";
      case "video":
        return "Video File";
    }
  }
}

export function applicationMimeName(miemtype: string) {
  const subtype = miemtype.split("/")[1];
  if (subtype) {
    switch (subtype) {
      case "pdf":
        return "PDF File";
      case "zip":
      case "x-tar":
      case "x-gzip":
      case "x-bzip2":
      case "x-xz":
      case "x-7z-compressed":
        return "Archive File";
      case "x-executable":
      case "x-sharedlib":
      case "x-dosexec":
      case "x-unix-binary":
      case "x-apple-diskimage":
      case "x-ms-dos-executable":
      case "x-object":
      case "x-bytecode.python":
        return "Executable File";
      case "application/msword":
      case "vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "vnd.oasis.opendocument.text":
      case "rtf":
      case "x-tex":
        return "Document File";
      case "application/x-sh":
      case "x-bat":
      case "x-cmd":
      case "x-powershell":
      case "x-shellscript":
      case "x-csh":
      case "x-perl":
      case "x-python":
      case "x-ruby":
      case "x-php":
      case "javascript":
      case "typescript":
      case "x-javascript":
      case "x-typescript":
      case "x-tilex-javascript":
      case "x-tilex-typescript":
      case "x-tilex-jsx":
      case "x-tilex-tsx":
        return "Script File";
    }
  }
}
