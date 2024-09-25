import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";

export class ClipcoardController {
  public readonly data = sig({
    files: [] as readonly FStat[],
    mode: "copy" as "copy" | "move",
  });

  constructor(
    protected explorer: Explorer,
  ) {}

  put(files: FStat | readonly FStat[], mode: "copy" | "move") {
    this.data.dispatch({
      files: Array.isArray(files) ? files : [files],
      mode,
    });
  }

  clear() {
    this.data.dispatch({
      files: [],
      mode: "copy",
    });
  }
}
