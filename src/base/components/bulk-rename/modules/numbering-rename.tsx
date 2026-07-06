import { Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Input, Typography } from "adwavecss";
import { FStat } from "../../../../filesystem-interface";
import { collator } from "../../../../utils/collator";
import { Path } from "../../../../utils/path";
import { RenameModule } from "../base-rename-module";

type RenameParameters = {
  withExt: boolean;
  startFrom: number;
  pad: number;
  reverse: boolean;
};

export class NumberingRename extends RenameModule<RenameParameters> {
  readonly mode = "numbering";

  private sortedFiles;

  constructor(
    allFiles: readonly FStat[],
    parameters: Signal<Record<string, any>>,
  ) {
    super(allFiles, parameters);

    this.sortedFiles = allFiles.slice().map(f => f.name).sort((a, b) =>
      collator.compare(a, b)
    );
  }

  defaults(): RenameParameters {
    return {
      withExt: true,
      startFrom: 1,
      pad: 1,
      reverse: false,
    };
  }

  getNewName(oldName: string): string {
    const { pad, startFrom, withExt, reverse } = this.parameters.get();
    const filelist = reverse ? this.sortedFiles.toReversed() : this.sortedFiles;
    const idx = filelist.indexOf(oldName);
    if (idx === -1) return oldName;

    const generateNumber = (idx: number) => {
      let num = startFrom + idx;
      const negative = num < 0;
      num = Math.abs(num);
      let str = `${num}`.padStart(pad, "0");
      if (negative) str = "-" + str;
      return str;
    };

    if (!withExt) {
      return generateNumber(idx);
    } else {
      const parsed = Path.from(oldName);
      const ext = parsed.ext();
      const newName = generateNumber(idx);
      if (ext) {
        return newName.concat(".", ext);
      } else {
        return newName;
      }
    }
  }

  Form({ disabled }: { disabled: Signal<boolean> }): JSX.Element {
    return (
      <div class="numbering-rename-form rename-form">
        <span class={Typography.text}>Extension:</span>
        <this.Checkbox
          param="withExt"
          disabled={disabled}
        />
        <span class={Typography.text}>Reverse order:</span>
        <this.Checkbox
          param="reverse"
          disabled={disabled}
        />
        <span class={Typography.text}>First number:</span>
        <this.Input
          class={Input.input}
          param="startFrom"
          type="number"
          disabled={disabled}
        />
        <span class={Typography.text}>Pad lenght:</span>
        <this.Input
          class={Input.input}
          param="pad"
          type="number"
          disabled={disabled}
        />
      </div>
    );
  }
}
