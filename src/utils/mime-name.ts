export function mimeName(mimetype: string): string | undefined {
  const mime = mimetype.split("/")[0];
  if (mime) {
    switch (mime) {
      case "application":
        return applicationMimeName(mimetype);
      case "audio":
        return "Audio";
      case "font":
        return "Font";
      case "image":
        return "Image";
      case "model":
        return "3D Model";
      case "text":
        return "Plain Text";
      case "video":
        return "Video";
    }
  }
}

export function applicationMimeName(miemtype: string) {
  const subtype = miemtype.split("/")[1];
  if (subtype) {
    switch (subtype) {
      case "pdf":
        return "PDF";
      case "zip":
      case "x-tar":
      case "x-gzip":
      case "x-bzip2":
      case "x-xz":
      case "x-7z-compressed":
        return "Archive";
      case "x-executable":
      case "x-sharedlib":
      case "x-dosexec":
      case "x-unix-binary":
      case "x-apple-diskimage":
      case "x-ms-dos-executable":
      case "x-object":
      case "x-bytecode.python":
        return "Executable";
      case "application/msword":
      case "vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "vnd.oasis.opendocument.text":
      case "rtf":
      case "x-tex":
        return "Document";
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
        return "Script";
    }
  }
}

/**
 * @param ext - filename extension, case-insensitive, with or without the
 * leading dot.
 */
export function nameByExt(ext: string): string | undefined {
  ext = ext.startsWith(".") ? ext.slice(1) : ext;
  ext = ext.toLowerCase();

  switch (ext) {
    case "log":
      return "Application log";
    case "json":
      return "JSON Document";
    case "ndjson":
    case "jsonl":
      return "JSON Document";
    case "html":
    case "htm":
    case "xhtml":
      return "HTML Document";
    case "sh":
      return "Shell script";
    case "bash":
    case "zsh":
    case "fish":
      return "Shell script";
    case "sql":
      return "SQLite 3 database";
    case "db":
    case "sqlite":
    case "sqlite3":
    case "db3":
      return "SQLite 3 database";
    case "mdb":
    case "accdb":
      return "Database";

    case "txt":
    case "text":
    case "textile":
      return "Plain Text";
    case "pdf":
      return "PDF";
    case "doc":
    case "docx":
    case "docm":
    case "odt":
    case "rtf":
    case "wpd":
    case "wps":
    case "tex":
    case "pages":
      return "Document";
    case "md":
    case "markdown":
    case "mdown":
    case "rst":
    case "adoc":
    case "asciidoc":
      return "Markdown Document";
    case "csv":
    case "tsv":
      return "CSV Document";
    case "xls":
    case "xlsx":
    case "xlsm":
    case "xlsb":
    case "ods":
    case "numbers":
      return "Spreadsheet";
    case "ppt":
    case "pptx":
    case "pptm":
    case "odp":
    case "key":
      return "Presentation";
    case "epub":
    case "mobi":
    case "azw":
    case "azw3":
    case "fb2":
      return "E-book";

    case "xml":
      return "XML Document";
    case "yaml":
    case "yml":
    case "toml":
    case "ini":
    case "cfg":
    case "conf":
    case "properties":
    case "plist":
      return "Configuration";
    case "env":
      return "Environment Configuration";
    case "gitignore":
    case "gitattributes":
    case "gitmodules":
      return "Git Config";

    case "css":
    case "scss":
    case "sass":
    case "less":
    case "styl":
      return "Stylesheet";
    case "js":
    case "mjs":
    case "cjs":
    case "jsx":
    case "ts":
    case "tsx":
    case "mts":
    case "cts":
    case "vue":
    case "svelte":
    case "php":
      return "Script";
    case "bat":
    case "cmd":
    case "ps1":
    case "psm1":
      return "Script";
    case "py":
    case "pyw":
    case "rb":
    case "pl":
    case "pm":
    case "lua":
    case "r":
    case "jl":
      return "Source Code";
    case "c":
    case "h":
    case "cpp":
    case "cxx":
    case "cc":
    case "hpp":
    case "hxx":
    case "hh":
    case "cs":
    case "java":
    case "kt":
    case "kts":
    case "scala":
    case "swift":
    case "m":
    case "mm":
    case "go":
    case "rs":
    case "zig":
    case "d":
    case "dart":
    case "groovy":
    case "gradle":
    case "asm":
    case "s":
    case "vb":
      return "Source Code";
    case "sol":
      return "Smart Contract";

    case "png":
    case "jpg":
    case "jpeg":
    case "jfif":
    case "gif":
    case "webp":
    case "svg":
    case "bmp":
    case "dib":
    case "tiff":
    case "tif":
    case "ico":
    case "cur":
    case "avif":
    case "heic":
    case "heif":
    case "psd":
    case "xcf":
    case "ai":
    case "tga":
    case "exr":
    case "raw":
    case "cr2":
    case "nef":
    case "arw":
      return "Image";

    case "mp4":
    case "m4v":
    case "mkv":
    case "avi":
    case "mov":
    case "webm":
    case "flv":
    case "wmv":
    case "mpg":
    case "mpeg":
    case "mpe":
    case "m2ts":
    case "vob":
    case "ogv":
    case "3gp":
    case "3g2":
      return "Video";

    case "mp3":
    case "wav":
    case "flac":
    case "ogg":
    case "oga":
    case "opus":
    case "m4a":
    case "m4b":
    case "aac":
    case "wma":
    case "aiff":
    case "aif":
    case "aifc":
    case "mid":
    case "midi":
    case "amr":
      return "Audio";
    case "mod":
    case "xm":
    case "it":
    case "s3m":
      return "Tracked Audio";

    case "ttf":
    case "otf":
    case "woff":
    case "woff2":
    case "eot":
    case "ttc":
    case "pfb":
    case "pfm":
    case "bdf":
      return "Font";

    case "zip":
    case "tar":
    case "gz":
    case "bz2":
    case "xz":
    case "zst":
    case "zstd":
    case "lz":
    case "lz4":
    case "lzma":
    case "7z":
    case "rar":
    case "tgz":
    case "tbz2":
    case "txz":
    case "cab":
    case "arj":
    case "lzh":
      return "Archive";
    case "iso":
    case "dmg":
    case "vhd":
    case "vdi":
    case "vmdk":
      return "Disk Image";
    case "deb":
    case "rpm":
    case "apk":
    case "appimage":
    case "msi":
      return "Package";

    case "exe":
      return "Executable";
    case "com":
    case "scr":
      return "Executable";
    case "dll":
    case "so":
    case "dylib":
    case "ocx":
      return "Library";
    case "o":
    case "obj":
      return "Object File";
    case "a":
    case "lib":
    case "ar":
      return "Static Library";
    case "class":
      return "Java Class";
    case "wasm":
      return "WebAssembly";

    case "stl":
    case "glb":
    case "gltf":
    case "fbx":
    case "dae":
    case "blend":
    case "blend1":
    case "3ds":
    case "ply":
    case "usd":
    case "usda":
    case "usdc":
    case "usdz":
      return "3D Model";

    case "ics":
      return "Calendar";
    case "vcf":
      return "Contact";
    case "torrent":
      return "Torrent";
    case "nfo":
      return "NFO File";
    case "srt":
    case "sub":
    case "ass":
    case "ssa":
    case "vtt":
      return "Subtitles";
  }
}
