import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";

export type PromptType = "question" | "input";
export type InputPromptValidator = (value: string) => "ok" | { msg: string };
export type QuestionResult = {
  answer: boolean;
};

const noop = () => {};

export class PromptController {
  public readonly isOpen = sig(false);
  public readonly type = sig<"question" | "input">("question");
  public readonly title = sig("");
  public readonly message = sig("");
  public readonly confirmBtnLabel = sig("Confirm");
  public readonly cancelBtnLabel = sig("Cancel");
  private readonly onConfirm = sig<(value: string) => void>(noop);
  private readonly onUserCancel = sig(noop);
  private readonly onCancel = sig<(reason?: any) => void>(noop);

  // input type only
  public readonly initialValue = sig("");
  public readonly placeholder = sig("");
  public readonly validateFn = sig<InputPromptValidator | undefined>(undefined);

  constructor(
    protected readonly explorer: Explorer,
  ) {}

  public internal = {
    confirm: (value: string) => {
      this.onConfirm.get()(value);
    },
    cancel: () => {
      this.onUserCancel.get()();
    },
  };

  private close() {
    sig.startBatch();
    this.isOpen.dispatch(false);
    this.type.dispatch("question");
    this.title.dispatch("");
    this.message.dispatch("");
    this.confirmBtnLabel.dispatch("Confirm");
    this.cancelBtnLabel.dispatch("Cancel");
    this.onConfirm.dispatch(noop);
    this.onUserCancel.dispatch(noop);
    this.onCancel.dispatch(noop);
    this.initialValue.dispatch("");
    this.placeholder.dispatch("");
    this.validateFn.dispatch(undefined);
    sig.commitBatch();
  }

  public ask(params: {
    title: string;
    message: string;
    confirmBtnLabel?: string;
    cancelBtnLabel?: string;
  }) {
    sig.startBatch();
    this.isOpen.dispatch(true);
    this.type.dispatch("question");
    this.title.dispatch(params.title);
    this.message.dispatch(params.message);
    this.confirmBtnLabel.dispatch(params.confirmBtnLabel ?? "Confirm");
    this.cancelBtnLabel.dispatch(params.cancelBtnLabel ?? "Cancel");

    return new Promise<QuestionResult>((res, rej) => {
      this.onConfirm.dispatch(() => () => {
        this.close();
        res({ answer: true });
      });
      this.onUserCancel.dispatch(() => () => {
        this.close();
        res({ answer: false });
      });
      this.onCancel.dispatch(() => (reason: any) => {
        this.close();
        rej(new PromptAborted(reason));
      });
      sig.commitBatch();
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
    sig.startBatch();
    this.isOpen.dispatch(true);
    this.type.dispatch("input");
    this.title.dispatch(params.title);
    this.message.dispatch(params.message);
    this.confirmBtnLabel.dispatch(params.confirmBtnLabel ?? "Confirm");
    this.cancelBtnLabel.dispatch(params.cancelBtnLabel ?? "Cancel");
    this.initialValue.dispatch(params.initialValue ?? "");
    this.placeholder.dispatch(params.placeholder ?? "");
    this.validateFn.dispatch(() => params.validate);

    return new Promise<string>((res, rej) => {
      this.onConfirm.dispatch(() => (value: string) => {
        this.close();
        res(value);
      });
      this.onUserCancel.dispatch(() => () => {
        this.close();
        res("");
      });
      this.onCancel.dispatch(() => (reason: any) => {
        this.close();
        rej(new PromptAborted(reason));
      });
      sig.commitBatch();
    });
  }

  public cancel(reason?: any) {
    this.onCancel.get()(reason);
  }
}

export class PromptAborted {
  constructor(reason?: any) {}
}
