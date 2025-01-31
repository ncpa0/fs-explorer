import { Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Input, Typography } from "adwavecss";
import { Path } from "../../../../utils/path";
import { RenameModule } from "../base-rename-module";

type RenameParameters = {
  withExt: boolean;
  expression: string;
  replacement: string;
  flags: string;
};

export class RegexRename extends RenameModule<RenameParameters> {
  readonly mode = "regex";

  defaults(): RenameParameters {
    return {
      withExt: true,
      expression: "",
      replacement: "",
      flags: "",
    };
  }

  getNewName(oldName: string): string {
    let { withExt, expression, replacement, flags } = this.parameters.get();

    if (replacement === "" || expression === "") return oldName;

    const replace = (str: string) => {
      try {
        const r = new RegExp(expression, flags);
        return str.replace(r, replacement);
      } catch {
        return str;
      }
    };

    if (withExt) {
      return replace(oldName);
    } else {
      const parsed = Path.from(oldName);
      const baseanme = parsed.basename(false);
      const ext = parsed.ext();
      const newName = replace(baseanme);
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
        <span class={Typography.text}>Regular Expression:</span>
        <this.Input
          class={Input.input}
          param="expression"
          disabled={disabled}
        />
        <span class={Typography.text}>Expression flags:</span>
        <this.Input
          class={Input.input}
          param="flags"
          disabled={disabled}
        />
        <span class={Typography.text}>Replacement:</span>
        <this.Input
          class={Input.input}
          param="replacement"
          disabled={disabled}
        />
      </div>
    );
  }
}
