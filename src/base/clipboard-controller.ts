import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";

export class ClipcoardController {
  public readonly files = sig<readonly FStat[]>([]);
  public readonly mode = sig<"copy" | "move">("copy");

  constructor(
    protected explorer: Explorer,
  ) {}

  put(files: FStat | readonly FStat[], mode: "copy" | "move") {
    this.files.dispatch(Array.isArray(files) ? files : [files]);
    this.mode.dispatch(mode);
  }

  clear() {
    this.files.dispatch([]);
  }
}
