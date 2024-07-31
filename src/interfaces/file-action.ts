import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";

export class FileActionContext {
  constructor(
    protected explorer: Explorer,
    protected file: FStat,
  ) {}

  openPreview() {
    this.explorer.previewPane.open(this.file);
  }
}
