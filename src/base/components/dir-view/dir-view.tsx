import { Range } from "@ncpa0cpl/vanilla-jsx";
import { Explorer } from "../../..";
import { FStat } from "../../../filesystem-interface";
import { ACSS } from "../../../utils/css";
import { Path } from "../../../utils/path";

export type DirViewProps = {
  explorer: Explorer;
};

export function DirView(props: DirViewProps) {
  const files = props.explorer.currentDir;

  return (
    <div class={[ACSS.Box.box, ACSS.Box.bg2, "dir-view"]}>
      <Range data={files} into={<div class="dcontents" />}>
        {(file) => <FileEntry explorer={props.explorer} file={file} />}
      </Range>
    </div>
  );
}

function FileEntry(props: { explorer: Explorer; file: FStat }) {
  const handleClick = () => {
    if (props.file.directory) {
      const path = new Path(props.file.path);
      props.explorer.open(path);
    }
  };

  return (
    <div class={["file-entry"]} onmousedown={handleClick}>
      <div class={{ "file-icon": true, directory: props.file.directory }}></div>
      <div class={["filename"]}>{props.file.name}</div>
      <div class={["file-size"]}>{props.file.size}</div>
      <div class={["file-modified"]}>{props.file.mtime}</div>
    </div>
  );
}
