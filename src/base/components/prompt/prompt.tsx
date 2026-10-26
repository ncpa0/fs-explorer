import { $component } from "@ncpa0cpl/vanilla-jsx";
import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { ADW } from "../../../utils/css";
import { isLmb } from "../../../utils/events";

export interface PropmptProps {
  type: "question" | "input";
  placeholder?: string;
  cancelBtnLabel: string;
  secondaryBtnLabel?: string;
  confirmBtnLabel: string;
  title: string;
  message?: string;
  initialValue?: string;
  validate?: (value: string) => "ok" | { msg: string };
  onConfirm: (value: string) => void;
  onSecondaryBtnClick?: () => void;
  onCancel: () => void;
}

export const Prompt = function Prompt(props: PropmptProps) {
  const {
    cancelBtnLabel,
    confirmBtnLabel,
    secondaryBtnLabel,
    title,
    type,
    message,
    placeholder,
    initialValue,
    validate,
    onConfirm,
    onCancel,
    onSecondaryBtnClick,
  } = props;

  const inputValue = sig(initialValue ?? "");
  const validationResult = inputValue.derive(
    (value) => {
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
      onConfirm(value);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const PromptInput = $component((_: {}, api) => {
    api.onMount(() => {
      input.focus();
    });

    const input = (
      <input
        class={{
          [ADW.Input.input]: true,
        }}
        value={inputValue}
        oninput={handleInput}
        onkeydown={handleKeyDown}
        placeholder={placeholder}
        autofocus
      />
    ) as HTMLInputElement;

    return input;
  });

  return (
    <div class={[ADW.Dialog.dialog, "prompt-dialog"]}>
      <div class={ADW.Dialog.header}>
        <button
          class={{
            [ADW.Button.button]: true,
            [ADW.Button.danger]: true,
          }}
          onmousedown={handleCancel}
        >
          {cancelBtnLabel}
        </button>
        <span class={["dialog-title"]}>
          {title}
        </span>
        <div class="right-btn-wrapper">
          {(secondaryBtnLabel && onSecondaryBtnClick) && (
            <button
              class={{
                [ADW.Button.button]: true,
                [ADW.Button.flat]: true,
                [ADW.Button.disabled]: disabledSubmit,
              }}
              disabled={disabledSubmit}
              onmousedown={e => isLmb(e) && onSecondaryBtnClick()}
            >
              {secondaryBtnLabel}
            </button>
          )}
          <button
            class={{
              [ADW.Button.button]: true,
              [ADW.Button.primary]: true,
              [ADW.Button.disabled]: disabledSubmit,
            }}
            disabled={disabledSubmit}
            onmousedown={handleConfirm}
          >
            {confirmBtnLabel}
          </button>
        </div>
      </div>
      <div class={[ADW.Dialog.body, "prompt-body"]}>
        <span class={[ADW.Typography.text, "prompt-message"]}>
          {message}
        </span>
        {type === "input" && <PromptInput />}
        {validationResult.derive(
          (vres) => {
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
  );
};
