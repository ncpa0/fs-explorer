import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { ADW } from "../../../utils/css";
import { Fmt } from "../../../utils/formatters";
import { mimeName } from "../../../utils/mime-name";

export type PreviewPaneProps = {
  explorer: Explorer;
};

export function PreviewPane(props: PreviewPaneProps) {
  const explorer = props.explorer;
  const preview = explorer.previewPane;

  const handleCloseClick = () => {
    preview.close();
  };

  return (
    <div
      class={{
        "preview-pane": true,
        "preview-visible": preview.file.derive(v => v != null),
        [ADW.Box.box]: true,
        [ADW.Box.bg3]: true,
      }}
    >
      <div class="info-header">
        <button
          class={ADW.Button.className({ flat: true, shape: "square" })}
          onmousedown={handleCloseClick}
        >
          X
        </button>
      </div>
      {preview.file.derive(file => {
        if (file) return <FileInfo file={file} />;
        return <div />;
      })}
    </div>
  );
}

function FileInfo(props: { file: FStat }) {
  let type = props.file.mimetype && mimeName(props.file.mimetype);
  if (props.file.directory) {
    type = "Directory";
  }

  return (
    <div class="file-info scrollview">
      <div class={["dcontents", "info-entry", ADW.Typography.text]}>
        <span class="info-label">Filename:</span>
        <span class="info-value">{props.file.name}</span>
      </div>
      <div class={["dcontents", "info-entry", ADW.Typography.text]}>
        <span class="info-label">Filepath:</span>
        <span class="info-value">{props.file.path}</span>
      </div>
      <div class={["dcontents", "info-entry", ADW.Typography.text]}>
        <span class="info-label">Size:</span>
        <span class="info-value">{Fmt.size(props.file.size)}</span>
      </div>
      {type
        && (
          <div class={["dcontents", "info-entry", ADW.Typography.text]}>
            <span class="info-label">Type:</span>
            <span class="info-value">{type}</span>
          </div>
        )}
      {props.file.ctime != null
        && (
          <div class={["dcontents", "info-entry", ADW.Typography.text]}>
            <span class="info-label">Created At:</span>
            <span class="info-value">{Fmt.date(props.file.ctime)}</span>
          </div>
        )}
      <div class={["dcontents", "info-entry", ADW.Typography.text]}>
        <span class="info-label">Modified At:</span>
        <span class="info-value">{Fmt.date(props.file.mtime)}</span>
      </div>
      {props.file.atime
        && (
          <div class={["dcontents", "info-entry", ADW.Typography.text]}>
            <span class="info-label">Accessed At:</span>
            <span class="info-value">{Fmt.date(props.file.atime)}</span>
          </div>
        )}
      <div class="dcontents">
        <span class={ADW.Typography.header} style="margin: 1.2em 0 .8em">
          Permissions
        </span>
        <span />
      </div>
      <div class={["dcontents", "info-entry", ADW.Typography.text]}>
        <span class="info-label">Read:</span>
        <span class="info-value">{String(props.file.read)}</span>
      </div>
      <div class={["dcontents", "info-entry", ADW.Typography.text]}>
        <span class="info-label">Write:</span>
        <span class="info-value">{String(props.file.write)}</span>
      </div>
    </div>
  );
}
