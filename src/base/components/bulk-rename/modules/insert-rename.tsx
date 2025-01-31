import { Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Input, Typography } from "adwavecss";
import { Path } from "../../../../utils/path";
import { RenameModule } from "../base-rename-module";

type RenameParameters = {
  withExt: boolean;
  atIndex: number;
  fromEnd: boolean;
  value: string;
};

export class InsertRename extends RenameModule<RenameParameters> {
  readonly mode = "insert";

  defaults(): RenameParameters {
    return {
      withExt: true,
      atIndex: 0,
      fromEnd: false,
      value: "",
    };
  }

  getNewName(oldName: string): string {
    let { withExt, atIndex, fromEnd, value } = this.parameters.get();

    if (value === "") return oldName;

    const insert = (str: string) => {
      atIndex = Math.min(str.length, Math.max(0, atIndex));
      const len = str.length;
      if (fromEnd) {
        const idx = len - atIndex;
        return str.slice(0, idx) + value + str.slice(idx);
      } else {
        return str.slice(0, atIndex) + value + str.slice(atIndex);
      }
    };

    if (withExt) {
      return insert(oldName);
    } else {
      const parsed = Path.from(oldName);
      const baseanme = parsed.basename(false);
      const ext = parsed.ext();
      const newName = insert(baseanme);
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
        <span class={Typography.text}>From end:</span>
        <this.Checkbox
          param="fromEnd"
          disabled={disabled}
        />
        <span class={Typography.text}>Index:</span>
        <this.Input
          class={Input.input}
          param="atIndex"
          type="number"
          disabled={disabled}
        />
        <span class={Typography.text}>Insert string:</span>
        <this.Input
          class={Input.input}
          param="value"
          disabled={disabled}
        />
      </div>
    );
  }
}
