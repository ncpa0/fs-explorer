import { Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import { AdwSwitchChangeEvent } from "adwaveui";
import { FStat } from "../../../filesystem-interface";

export type RenameMode = "numbering" | "replace" | "regex" | "trim" | "insert";

export abstract class RenameModule<
  P extends Record<string, any> & { withExt: boolean },
> {
  protected readonly parameters: Signal<P>;

  constructor(
    protected readonly allFiles: readonly FStat[],
    parameters: Signal<Record<string, any>>,
  ) {
    this.parameters = parameters as any;
    this.parameters.dispatch(this.defaults());

    this.Form = this.Form.bind(this);
    this.Input = this.Input.bind(this);
    this.Checkbox = this.Checkbox.bind(this);
  }

  abstract readonly mode: RenameMode;
  abstract defaults(): P;
  abstract getNewName(oldName: string): string;
  abstract Form(props: { disabled: Signal<boolean> }): JSX.Element;

  protected Input(
    p:
      & { param: keyof P }
      & JSX.IntrinsicElements["input"],
  ): JSX.Element {
    const { param: paramKey, ...inputprops } = p;

    const handleChange = (e: Event) => {
      let newValue: string | number = (e.target as HTMLInputElement).value;
      if (inputprops.type === "number") {
        newValue = Number(newValue);
      }
      this.parameters.dispatch(current => ({
        ...current,
        [paramKey]: newValue,
      }));
    };

    return (
      <input
        type="text"
        {...inputprops}
        value={this.parameters.derive(p => p[paramKey])}
        oninput={handleChange}
      />
    );
  }

  protected Checkbox(
    p: { param: keyof P; disabled: Signal<boolean> },
  ): JSX.Element {
    const { param: paramKey, disabled } = p;

    const handleChange = (e: AdwSwitchChangeEvent) => {
      const newValue = e.active;
      this.parameters.dispatch(current => ({
        ...current,
        [paramKey]: newValue,
      }));
    };

    return (
      <adw-switch
        active={this.parameters.derive(p => p[paramKey]) as any}
        disabled={disabled as any}
        onchange={handleChange}
      />
    );
  }
}
