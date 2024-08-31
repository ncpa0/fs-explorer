import { Explorer } from "../explorer";
import { Filesystem, FStat } from "../filesystem-interface";
import { ActionError } from "../interfaces/action-error";
import { Immediate } from "../utils/immediate";
import { Path } from "../utils/path";

export class FsController {
  constructor(
    protected explorer: Explorer,
    protected filesystem: Filesystem,
  ) {}

  copy(from: FStat, to: string | Path) {
    to = Path.from(to);

    if (to.equals(from.path)) {
      return Immediate.resolve();
    }

    return this.filesystem.copy(from.path, to.toString())
      .then(() => {
        this.explorer.refresh();
      })
      .catch(err => {
        this.explorer.actionError.dispatch(
          ActionError.copy(err, from.path, to.toString()),
        );
      });
  }

  move(file: FStat, to: string | Path) {
    to = Path.from(to);

    if (to.equals(file.path)) {
      return Immediate.resolve();
    }

    return this.filesystem.move(file.path, to.toString())
      .then(() => {
        this.explorer.refresh();
      })
      .catch(err => {
        this.explorer.actionError.dispatch(
          ActionError.move(err, file.path, to.toString()),
        );
      });
  }

  remove(file: FStat) {
    return this.filesystem.remove(file.path)
      .then(() => {
        this.explorer.refresh();
      })
      .catch(err => {
        this.explorer.actionError.dispatch(
          ActionError.remove(err, file.path),
        );
      });
  }

  mkdir(path: string | Path) {
    path = Path.from(path);

    return this.filesystem.mkdir(path.toString())
      .then(() => {
        this.explorer.refresh();
      })
      .catch(err => {
        this.explorer.actionError.dispatch(
          ActionError.mkdir(err, path.toString()),
        );
      });
  }

  touch(path: string | Path) {
    path = Path.from(path);

    return this.filesystem.touch(path.toString())
      .then(() => {
        this.explorer.refresh();
      })
      .catch(err => {
        this.explorer.actionError.dispatch(
          ActionError.touch(err, path.toString()),
        );
      });
  }

  clipboardPaste(to: string | Path) {
    to = Path.from(to);
    const files = this.explorer.clipboard.files.get();
    const mode = this.explorer.clipboard.mode.get();
    if (files) {
      this.explorer.clipboard.clear();
      this.filesystem.readdir(to.toString()).then(async (existingFiles) => {
        for (const f of files) {
          if (existingFiles.some((efname) => efname === f.name)) {
            const res = await this.explorer.prompt.ask({
              title: "File already exist",
              message:
                `File "${f.name}" already exists, do you want to overwrite it?`,
              cancelBtnLabel: "Skip",
              confirmBtnLabel: "Overwrite",
            });

            if (res.answer === false) {
              continue;
            }
          }

          const dest = to.joinSegment(f.name);
          if (mode === "move") {
            await this.move(f, dest).catch(err => {});
          } else {
            await this.copy(f, dest).catch(err => {});
          }
        }
      });
    }
  }
}
