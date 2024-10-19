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
  private onConfirm: (value: string) => void = noop;
  private onUserCancel = noop;
  private onCancel: (reason?: any) => void = noop;

  // input type only
  public readonly initialValue = sig("");
  public readonly placeholder = sig("");
  public readonly validateFn = sig<InputPromptValidator | undefined>(undefined);

  constructor(
    protected readonly explorer: Explorer,
  ) {}

  public internal = {
    confirm: (value: string) => {
      this.onConfirm(value);
    },
    cancel: () => {
      this.onUserCancel();
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
    this.initialValue.dispatch("");
    this.placeholder.dispatch("");
    this.validateFn.dispatch(undefined);
    this.onConfirm = noop;
    this.onUserCancel = noop;
    this.onCancel = noop;
    sig.commitBatch();
  }

  public ask(params: {
    title: string;
    message: string;
    confirmBtnLabel?: string;
    cancelBtnLabel?: string;
  }) {
    if (this.isOpen.get()) {
      throw new Error(
        "Cannot open new prompt until the previous one is closed.",
      );
    }

    sig.startBatch();
    this.isOpen.dispatch(true);
    this.type.dispatch("question");
    this.title.dispatch(params.title);
    this.message.dispatch(params.message);
    this.confirmBtnLabel.dispatch(params.confirmBtnLabel ?? "Confirm");
    this.cancelBtnLabel.dispatch(params.cancelBtnLabel ?? "Cancel");
    sig.commitBatch();

    return new Promise<QuestionResult>((res, rej) => {
      this.onConfirm = () => {
        this.close();
        res({ answer: true });
      };
      this.onUserCancel = () => {
        this.close();
        res({ answer: false });
      };
      this.onCancel = (reason: any) => {
        this.close();
        rej(new PromptAborted(reason));
      };
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
    if (this.isOpen.get()) {
      throw new Error(
        "Cannot open new prompt until the previous one is closed.",
      );
    }

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
    sig.commitBatch();

    return new Promise<string>((res, rej) => {
      this.onConfirm = (value: string) => {
        this.close();
        res(value);
      };
      this.onUserCancel = () => {
        this.close();
        res("");
      };
      this.onCancel = (reason: any) => {
        this.close();
        rej(new PromptAborted(reason));
      };
    });
  }

  public cancel(reason?: any) {
    this.onCancel(reason);
  }
}

export class PromptAborted {
  constructor(public reason?: any) {}
}
