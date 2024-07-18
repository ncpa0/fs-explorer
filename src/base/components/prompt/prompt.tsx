import { $component } from "@ncpa0cpl/vanilla-jsx";
import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../..";
import { ADW } from "../../../utils/css";

export interface PropmptProps {
  explorer: Explorer;
}

export const Prompt = $component(function Prompt(props: PropmptProps, api) {
  const { explorer } = props;
  const { promptModal } = explorer;
  const inputValue = sig("");
  const validationResult = sig.derive(
    promptModal,
    inputValue,
    ({ validate = (): "ok" => "ok" }, value) => validate(value),
  );

  const disabledSubmit = validationResult.derive(v => v !== "ok");

  const handleInput = (e: Event) => {
    inputValue.dispatch((e.target as HTMLInputElement).value);
  };

  const handleConfirm = () => {
    if (validationResult.get() === "ok") {
      const { onConfirm } = promptModal.get();
      const value = inputValue.get();

      inputValue.dispatch("");
      promptModal.dispatch({ open: false });

      onConfirm?.(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  api.onChange(() => {
    const initialValue = promptModal.get().initialValue;
    if (initialValue != null && inputValue.get() === "") {
      inputValue.dispatch(initialValue);
    }
  }, [promptModal]);

  return (
    <div
      class={{
        "prompt-backdrop": true,
        hidden: promptModal.derive(p => !p.open),
      }}
    >
      <div class="prompt">
        <div class="prompt-header">
          <span class={["prompt-title", ADW.Typography.text]}>
            {promptModal.derive(p => p.prompt)}
          </span>
        </div>
        <div class="prompt-body">
          <div class={["prompt-buttons", ADW.Input.linked]}>
            <input
              class={ADW.Input.input}
              value={inputValue}
              oninput={handleInput}
              onkeydown={handleKeyDown}
            />
            <button
              class={{
                [ADW.Button.button]: true,
                [ADW.Button.disabled]: disabledSubmit,
              }}
              disabled={disabledSubmit}
              onmousedown={handleConfirm}
            >
              {promptModal.derive(p => p.confirmBtnLabel ?? "Confirm")}
            </button>
          </div>
          {validationResult.derive(res =>
            res !== "ok" && (
              <div class="error-msg">
                <span class={ADW.Message.className({ type: "error" })}>
                  {res.msg}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
});
