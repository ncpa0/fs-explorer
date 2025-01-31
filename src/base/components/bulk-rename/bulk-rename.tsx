import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Button, Message, ScrollView, Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { Path } from "../../../utils/path";
import { RenameMode, RenameModule } from "./base-rename-module";
import { InsertRename } from "./modules/insert-rename";
import { NumberingRename } from "./modules/numbering-rename";
import { RegexRename } from "./modules/regex-rename";
import { ReplaceRename } from "./modules/replace-rename";
import { TrimRename } from "./modules/trim-rename";

export type BulkRenameProps = {
  files: readonly FStat[];
  explorer: Explorer;
};

export function BulkRename(props: BulkRenameProps) {
  const mode = sig<RenameMode>("replace");
  const disabled = sig<boolean>(false);
  const error = sig<string | null>(null);

  const parameters = sig<Record<string, any>>({});
  const module = mode.derive((mode): RenameModule<any> => {
    switch (mode) {
      case "replace":
        return new ReplaceRename(props.files, parameters);
      case "numbering":
        return new NumberingRename(props.files, parameters);
      case "trim":
        return new TrimRename(props.files, parameters);
      case "insert":
        return new InsertRename(props.files, parameters);
      case "regex":
        return new RegexRename(props.files, parameters);
    }
    throw new Error("Invalid mode");
  });

  const handleApply = async () => {
    disabled.dispatch(true);
    try {
      const fs = props.explorer.fs;
      const m = module.get();

      const renames = props.files.map(
        (f): [FStat, string | undefined] => {
          const newName = m.getNewName(f.name);
          if (newName === f.name) return [f, undefined];
          return [f, newName];
        },
      );

      const isImpossible = renames.some(([, newName]) => {
        if (!newName) return false;
        if (newName === "") return true;
        if (newName.includes("/")) return true;
        if (newName.includes("\\")) return true;
        return false;
      });

      if (isImpossible) {
        error.dispatch("Cannot rename: invalid names");
        return;
      }

      const nameSet = new Set<string>();
      let putCount = 0;
      for (const [, newName] of renames) {
        if (newName === undefined) continue;
        putCount++;
        nameSet.add(newName);
      }

      if (nameSet.size !== putCount) {
        error.dispatch("Cannot rename: duplicate names");
        return;
      }

      const outDir = props.files[0]!.basedir;
      const dirFiles = await props.explorer.filesystem.readdir(outDir);

      const futureDirList = dirFiles.map(file => {
        const newName = renames.find(([f]) => f.name === file)?.[1];
        if (!newName) return file;
        return newName;
      });

      const hasConflicts = new Set(futureDirList).size !== futureDirList.length;
      if (hasConflicts) {
        error.dispatch(
          "Cannot rename: names conflict with other files in the directory",
        );
        return;
      }

      let hasUnresolvedConflicts = false;
      let iterations = 0;
      while (true) {
        iterations++;
        let allok = true;
        for (let i = 0; i < renames.length; i++) {
          const [, newName] = renames[i]!;
          if (newName === undefined) continue;
          const sameNameFIdx = renames.findIndex(
            ([f]) => f.name === newName,
          );
          if (sameNameFIdx === -1) continue;
          if (sameNameFIdx < i) continue;

          // move the current rename op after the conflicting one
          renames.splice(sameNameFIdx + 1, 0, renames[i]!);
          renames.splice(i, 1);
          allok = false;
          break;
        }
        if (allok) break;
        if (iterations >= 100_000) {
          hasUnresolvedConflicts = true;
          break;
        }
      }

      try {
        if (hasUnresolvedConflicts) {
          const renamesWithTmpNames = renames.map(
            ([f, newName]): [FStat, string, string | undefined] => {
              const uid = "__tmp_fname_" + Math.random().toString(36).slice(2);
              return [f, uid, newName];
            },
          );
          for (const [f, tmpName, newName] of renamesWithTmpNames) {
            if (newName === undefined) continue;
            const dirpath = Path.from(f.basedir);
            const newPath = dirpath.joinSegment(tmpName);
            await fs.move(f, newPath);
          }
          for (const [f, tmpName, newName] of renamesWithTmpNames) {
            if (newName === undefined) continue;
            const dirpath = Path.from(f.basedir);
            const tmpPath = dirpath.joinSegment(tmpName);
            const newPath = dirpath.joinSegment(newName);
            const tmpFile: FStat = {
              ...f,
              path: tmpPath.toString(),
              name: tmpName,
            };
            await fs.move(tmpFile, newPath);
          }
        } else {
          for (const [f, newName] of renames) {
            if (newName === undefined) continue;
            const dirpath = Path.from(f.basedir);
            const newPath = dirpath.joinSegment(newName);
            await fs.move(f, newPath);
          }
        }
      } finally {
        props.explorer.overlay.close();
      }
    } finally {
      disabled.dispatch(false);
    }
  };

  const handleClose = () => {
    props.explorer.overlay.close();
  };

  return (
    <div class="bulk-rename-modal card">
      <h2 class={Typography.header}>Bulk Rename</h2>
      <div class="rename-preview">
        <div class={["preview-list-header"]}>
          <span class={["col-label", Typography.label]}>Old Name</span>
          <span class={["col-label", Typography.label]}>New Name</span>
        </div>
        <ul class={["preview-list", ScrollView.scrollView]}>
          {props.files.map(file => (
            <li>
              <span class={["old-name", Typography.text]}>{file.name}</span>
              <span class={["new-name", Typography.text]}>
                {sig.derive(module, parameters, m => {
                  const nn = m.getNewName(file.name);
                  if (nn === file.name) return "";
                  return nn;
                })}
              </span>
            </li>
          ))}
        </ul>
        <div class="preview-list-footer"></div>
      </div>
      <div class="rename-form-container">
        <adw-selector
          onChange={(e) =>
            mode.dispatch((e.detail.value as RenameMode) ?? "replace")}
        >
          <adw-option value="replace" selected>Replace</adw-option>
          <adw-option value="numbering">Numbering</adw-option>
          <adw-option value="regex">Regex</adw-option>
          <adw-option value="trim">Trim</adw-option>
          <adw-option value="insert">Insert</adw-option>
        </adw-selector>
        {module.derive(m => {
          return <m.Form disabled={disabled} />;
        })}
      </div>
      <div class="error-message">
        <span class={[Message.message, Message.error]}>{error}</span>
      </div>
      <div class="buttons">
        <button
          class={{
            [Button.button]: true,
            [Button.disabled]: disabled,
          }}
          disabled={disabled}
          onclick={handleClose}
        >
          Close
        </button>
        <button
          class={{
            [Button.button]: true,
            [Button.primary]: true,
            [Button.disabled]: disabled,
          }}
          disabled={disabled}
          onclick={handleApply}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
