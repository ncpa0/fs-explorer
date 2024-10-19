import { $component } from "@ncpa0cpl/vanilla-jsx";
import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";

export interface PropmptProps {
  explorer: Explorer;
}

export const Prompt = $component(function Prompt(props: PropmptProps, api) {
  const { explorer } = props;
  const { prompt } = explorer;
  const hide = prompt.isOpen.derive(open => !open);
  const inputValue = sig("");
  const validationResult = sig.derive(
    inputValue,
    prompt.validateFn,
    (value, validate) => {
      return validate ? validate(value) : "ok";
    },
  );

  const disabledSubmit = validationResult.derive(v => v !== "ok");

  const handleInput = (e: Event) => {
    inputValue.dispatch((e.target as HTMLInputElement).value);
  };

  const handleConfirm = () => {
    if (validationResult.get() === "ok") {
      const value = inputValue.get();
      inputValue.dispatch("");
      prompt.internal.confirm(value);
    }
  };

  const hanldeCancel = () => {
    prompt.internal.cancel();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  api.onChange(() => {
    const open = prompt.isOpen.get();

    if (open && prompt.type.get() === "input") {
      const initialValue = prompt.initialValue.get();
      if (initialValue != null) {
        inputValue.dispatch(initialValue);
      }
      inputElem.focus();
    }
  }, [prompt.isOpen]);

  const inputElem = (
    <input
      class={{
        [ADW.Input.input]: true,
        hidden: sig.eq(prompt.type, "question"),
      }}
      value={inputValue}
      oninput={handleInput}
      onkeydown={handleKeyDown}
      placeholder={prompt.placeholder}
    />
  ) as HTMLInputElement;

  return (
    <div
      class={{
        "prompt-backdrop": true,
        hidden: hide,
      }}
    >
      <div class={ADW.Dialog.dialog}>
        <div class={ADW.Dialog.header}>
          <button
            class={{
              [ADW.Button.button]: true,
              [ADW.Button.flat]: true,
            }}
            onmousedown={hanldeCancel}
          >
            {prompt.cancelBtnLabel}
          </button>
          <span class={["dialog-title"]}>
            {prompt.title}
          </span>
          <button
            class={{
              [ADW.Button.button]: true,
              [ADW.Button.primary]: true,
              [ADW.Button.disabled]: disabledSubmit,
            }}
            disabled={disabledSubmit}
            onmousedown={handleConfirm}
          >
            {prompt.confirmBtnLabel}
          </button>
        </div>
        <div class={[ADW.Dialog.body, "prompt-body"]}>
          <span class={[ADW.Typography.text, "prompt-message"]}>
            {prompt.message}
          </span>
          {inputElem}
          {sig.derive(
            prompt.type,
            validationResult,
            (type, vres) => {
              if (type === "input" && vres !== "ok") {
                return (
                  <div class="error-msg">
                    <span class={ADW.Message.className({ type: "error" })}>
                      {vres.msg}
                    </span>
                  </div>
                );
              }
            },
          )}
        </div>
      </div>
    </div>
  );
});
