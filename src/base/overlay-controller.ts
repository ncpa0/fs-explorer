import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { ElementPosition } from "./context-menu-controller";

export type OverlayOptions = {
  position?: ElementPosition;
  dimBackground?: boolean;
};

export class OverlayController {
  private content = sig<JSX.Element>();
  private position = sig<ElementPosition | undefined>();
  private dimBackground = sig<boolean>(true);

  display(pos: OverlayOptions, content: JSX.Element): void;
  display(content: JSX.Element): void;
  display(
    ...args: [pos: OverlayOptions, content: JSX.Element] | [
      content: JSX.Element,
    ]
  ): void {
    if (args.length === 1) {
      this.content.dispatch(args[0]);
    } else {
      this.content.dispatch(args[1]);
      if (args[0].position) {
        this.position.dispatch(args[0].position);
      }
      if (args[0].dimBackground != null) {
        this.dimBackground.dispatch(args[0].dimBackground);
      }
    }
  }

  close(): void {
    this.content.dispatch(undefined);
    this.position.dispatch(undefined);
    this.dimBackground.dispatch(true);
  }

  hasContent(): ReadonlySignal<boolean> {
    return this.content.derive(c => c != null);
  }

  dimBg(): ReadonlySignal<boolean> {
    return this.dimBackground.readonly();
  }

  Output = () => {
    return this.content.readonly();
  };

  Position = () => {
    return this.position.readonly();
  };
}
