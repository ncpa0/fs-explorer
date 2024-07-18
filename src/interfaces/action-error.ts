export interface ErrorWithMessage {
  getUserErrorMessage(): string;
}

function isErrorWithMessage(error: any): error is ErrorWithMessage {
  return error != null && typeof error === "object"
    && typeof error.getUserErrorMessage == "function";
}

export type ActionType = "copy" | "cut" | "remove" | "move" | "mkdir" | "touch";

export class ActionError {
  static copy(error: any, from: string, to: string) {
    let msg = "Copy operation has failed.";
    if (isErrorWithMessage(error)) {
      msg = error.getUserErrorMessage();
    }

    return new ActionError("copy", msg, error, { from, to });
  }

  static cut(error: any, from: string, to: string) {
    let msg = "Cut operation has failed.";
    if (isErrorWithMessage(error)) {
      msg = error.getUserErrorMessage();
    }

    return new ActionError("cut", msg, error, { from, to });
  }

  static remove(error: any, file: string) {
    let msg = "Delete operation has failed.";
    if (isErrorWithMessage(error)) {
      msg = error.getUserErrorMessage();
    }

    return new ActionError("remove", msg, error, { file });
  }

  static move(error: any, from: string, to: string) {
    let msg = "Move file operation has failed.";
    if (isErrorWithMessage(error)) {
      msg = error.getUserErrorMessage();
    }

    return new ActionError("move", msg, error, { from, to });
  }

  static mkdir(error: any, path: string) {
    let msg = "Create directory operation has failed.";
    if (isErrorWithMessage(error)) {
      msg = error.getUserErrorMessage();
    }

    return new ActionError("mkdir", msg, error, { path });
  }

  static touch(error: any, path: string) {
    let msg = "Create file operation has failed.";
    if (isErrorWithMessage(error)) {
      msg = error.getUserErrorMessage();
    }

    return new ActionError("touch", msg, error, { path });
  }

  constructor(
    public readonly actionType: ActionType,
    public readonly msg: string,
    public readonly cause: any,
    public readonly data: any,
  ) {}
}
