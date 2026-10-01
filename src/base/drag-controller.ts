import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";

export class DragController {
  private draggedFiles = sig<readonly FStat[] | null>(null);
  private _dragging = this.draggedFiles.derive(f => f != null);
  /**
   * Document-level listener that detects the pointer leaving the window while
   * a drag is in progress.
   *
   * Two complementary detection mechanisms:
   *
   * 1. Boundary-crossing events (`mouseout` with a null `relatedTarget`,
   *    dispatched when the pointer exits the document). On some platforms
   *    Chromium suppresses these while a mouse button is held (the implicit
   *    drag grab can swallow boundary-crossing mouse events), so they cannot
   *    be the only signal.
   * 2. Coordinate-based detection: while a drag is active, out-of-window
   *    `pointermove` coordinates (negative or beyond the viewport bounds)
   *    mean the pointer has left the window even if no boundary event was
   *    delivered. Chromium does keep delivering moves with out-of-window
   *    coordinates in the button-held state (the last event before a
   *    boundary event, and the only signal when boundary events are
   *    suppressed).
   *
   * Both run in the capture phase so that they fire before any element-level
   * `mouseleave` handlers (which cancel the drag on exit).
   */
  constructor(
    private readonly explorer: Explorer,
    cleanups: Array<() => void> = [],
  ) {
    // const handlePointerOut = (event: MouseEvent) => {
    //   if (event.relatedTarget == null) {
    //     this.handlePointerExit(event);
    //   }
    // };
    // const handleDragMove = (event: MouseEvent) => {
    //   if (!this.isDragging().get()) return;
    //   console.log(event);
    //   // A single out-of-bounds reading is enough - transient sub-pixel
    //   // overflows are not a thing here, the pointer is genuinely outside.
    //   const { clientX, clientY } = event;
    //   const isOutOfBounds = clientX < 0
    //     || clientY < 0
    //     || clientX >= window.innerWidth
    //     || clientY >= window.innerHeight;
    //   if (isOutOfBounds) {
    //     this.handlePointerExit(event);
    //   }
    // };
    // document.addEventListener("mouseout", (ev) => {
    //   handlePointerOut(ev);
    // }, { capture: true });
    // // Both event families are tracked: Chromium is inconsistent about which
    // // one it delivers at the window boundary while a button is held (pointer
    // // events may be dropped in favor of the compatibility mouse events or
    // // vice versa), so either alone can miss the exit.
    // document.addEventListener("pointermove", (ev) => {
    //   handleDragMove(ev);
    // }, {
    //   capture: true,
    // });
    // document.addEventListener("mousemove", ev => {
    //   handleDragMove(ev);
    // }, {
    //   capture: true,
    // });
    // cleanups.push(() => {
    //   document.removeEventListener("mouseout", handlePointerOut, true);
    //   document.removeEventListener("pointermove", handleDragMove, true);
    //   document.removeEventListener("mousemove", handleDragMove, true);
    // });
  }

  isDragging() {
    return this._dragging;
  }

  startDrag(files: readonly FStat[]) {
    this.draggedFiles.dispatch(files);
  }

  endDrag() {
    this.draggedFiles.dispatch(null);
  }

  /** Called when the cursor leaves the window. */
  mouseLeave() {
    this.triggerPointerExit();
  }

  getDraggedFiles() {
    return this.draggedFiles.get();
  }

  /**
   * Handles the pointer leaving the window while a drag is in progress
   * (pointer exit with the mouse button still held). Gives the host a chance
   * to take over the drag via `ExplorerOptions.nativeDragOut` (e.g. hand it
   * to the OS), then ends the emulated drag without dropping - regardless of
   * whether the host took over, the emulated drag never drops outside of the
   * window.
   */
  triggerPointerExit(): void {
    const files = this.draggedFiles.get();
    if (!files || !files.length) return;

    this.explorer.options.nativeDragOut?.(files);

    this.endDrag();
  }
}
