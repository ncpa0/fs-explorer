import { Explorer } from "../explorer";
import { Prompt } from "./components/prompt/prompt";

export type PromptType = "question" | "input";
export type InputPromptValidator = (value: string) => "ok" | { msg: string };
export type QuestionResult = {
  answer: boolean;
};

export class PromptController {
  private _open = false;
  private _cancel?: (reason?: any) => void;

  constructor(
    protected readonly explorer: Explorer,
  ) {}

  private close() {
    this.explorer.overlay.close();
    this._open = false;
  }

  public ask(params: {
    title: string;
    message: string;
    confirmBtnLabel?: string;
    cancelBtnLabel?: string;
  }) {
    return new Promise<QuestionResult>((res, rej) => {
      const onConfirm = () => {
        this.close();
        res({ answer: true });
      };
      const onUserCancel = () => {
        this.close();
        res({ answer: false });
      };
      this._cancel = (reason?: any) => {
        this.close();
        rej(new PromptAborted(reason));
        this._cancel = undefined;
      };

      this.explorer.overlay.display(
        { closeOnBackgroundClick: false },
        <Prompt
          type="question"
          title={params.title}
          message={params.message}
          confirmBtnLabel={params.confirmBtnLabel ?? "Yes"}
          cancelBtnLabel={params.cancelBtnLabel ?? "No"}
          onConfirm={onConfirm}
          onCancel={onUserCancel}
        />,
      );

      this._open = true;
    });
  }

  public input(
    params: {
      title: string;
      message: string;
      confirmBtnLabel?: string;
      cancelBtnLabel?: string;
      initialValue?: string;
      placeholder?: string;
      validate?: InputPromptValidator;
    },
  ) {
    return new Promise<string | undefined>((res, rej) => {
      const onConfirm = (value: string) => {
        this.close();
        res(value);
      };
      const onUserCancel = () => {
        this.close();
        res(undefined);
      };
      this._cancel = (reason: any) => {
        this.close();
        rej(new PromptAborted(reason));
      };

      this.explorer.overlay.display(
        { closeOnBackgroundClick: false },
        <Prompt
          type="input"
          title={params.title}
          message={params.message}
          confirmBtnLabel={params.confirmBtnLabel ?? "OK"}
          cancelBtnLabel={params.cancelBtnLabel ?? "Cancel"}
          initialValue={params.initialValue}
          placeholder={params.placeholder}
          validate={params.validate}
          onConfirm={onConfirm}
          onCancel={onUserCancel}
        />,
      );

      this._open = true;
    });
  }

  public isOpen() {
    return this._open;
  }

  public cancel(reason?: any) {
    this._cancel?.(reason);
  }
}

export class PromptAborted {
  constructor(public reason?: any) {}
}
