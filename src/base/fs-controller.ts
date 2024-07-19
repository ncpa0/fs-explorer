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

    const clip = this.explorer.clipboard.get();

    if (clip.file) {
      this.explorer.clipboard.dispatch({ file: [] });
      if (clip.cut) {
        for (const f of clip.file) {
          this.move(f, to.joinSegment(f.name));
        }
      } else {
        for (const f of clip.file) {
          this.copy(f, to.joinSegment(f.name));
        }
      }
    }
  }
}
