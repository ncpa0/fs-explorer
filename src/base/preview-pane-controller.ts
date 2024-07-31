import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";

export class PreviewPaneController {
  public readonly file = sig<undefined | FStat>(undefined);

  constructor(
    protected explorer: Explorer,
  ) {}

  open(file: FStat) {
    this.file.dispatch(file);
  }

  close() {
    this.file.dispatch(undefined);
  }
}
