import { Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Input, Typography } from "adwavecss";
import { Path } from "../../../../utils/path";
import { RenameModule } from "../base-rename-module";

type RenameParameters = {
  withExt: boolean;
  fromStart: number;
  fromEnd: number;
};

export class TrimRename extends RenameModule<RenameParameters> {
  readonly mode = "trim";

  defaults(): RenameParameters {
    return {
      withExt: true,
      fromEnd: 0,
      fromStart: 0,
    };
  }

  getNewName(oldName: string): string {
    const { withExt, fromEnd, fromStart } = this.parameters.get();

    if (fromEnd === 0 && fromStart === 0) return oldName;

    const trim = (str: string) => {
      const len = str.length;
      if (fromStart >= len) return "";
      if (fromEnd >= len) return "";
      return str.slice(fromStart, len - fromEnd);
    };

    if (withExt) {
      return trim(oldName);
    } else {
      const parsed = Path.from(oldName);
      const baseanme = parsed.basename(false);
      const ext = parsed.ext();
      const newName = trim(baseanme);
      if (ext) {
        return newName.concat(".", ext);
      } else {
        return newName;
      }
    }
  }

  Form({ disabled }: { disabled: Signal<boolean> }): JSX.Element {
    return (
      <div class="replace-rename-form rename-form">
        <span class={Typography.text}>Extension:</span>
        <this.Checkbox
          param="withExt"
          disabled={disabled}
        />
        <span class={Typography.text}>Trim from start:</span>
        <this.Input
          class={Input.input}
          param="fromStart"
          type="number"
          disabled={disabled}
        />
        <span class={Typography.text}>Trim from end:</span>
        <this.Input
          class={Input.input}
          param="fromEnd"
          type="number"
          disabled={disabled}
        />
      </div>
    );
  }
}
