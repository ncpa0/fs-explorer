import { Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Input, Typography } from "adwavecss";
import { Path } from "../../../../utils/path";
import { RenameModule } from "../base-rename-module";

type RenameParameters = {
  withExt: boolean;
  search: string;
  replace: string;
  replaceAll: boolean;
};

export class ReplaceRename extends RenameModule<RenameParameters> {
  readonly mode = "replace";

  defaults(): RenameParameters {
    return {
      withExt: true,
      replace: "",
      search: "",
      replaceAll: true,
    };
  }

  getNewName(oldName: string): string {
    const { search, replace: replaceWith, withExt, replaceAll } = this
      .parameters.get();

    if (search === "") return oldName;

    const replace = replaceAll
      ? (str: string) => str.replaceAll(search, replaceWith)
      : (str: string) => str.replace(search, replaceWith);

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
        <span class={Typography.text}>Replace all occurrences:</span>
        <this.Checkbox
          param="replaceAll"
          disabled={disabled}
        />
        <span class={Typography.text}>Search for:</span>
        <this.Input class={Input.input} param="search" disabled={disabled} />
        <span class={Typography.text}>Replace with:</span>
        <this.Input class={Input.input} param="replace" disabled={disabled} />
      </div>
    );
  }
}
