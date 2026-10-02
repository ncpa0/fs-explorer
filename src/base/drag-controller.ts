import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";

export class DragController {
  private draggedFiles = sig<readonly FStat[] | null>(null);
  private _dragging = this.draggedFiles.derive(f => f != null);

  constructor(
    private readonly explorer: Explorer,
    cleanups: Array<() => void> = [],
  ) {}

  isDragging() {
    return this._dragging;
  }

  startDrag(files: readonly FStat[]) {
    // Internal (emulated) dragging can be disabled by the host; external
    // drops (`fileDropHandler`) don't go through here and keep working.
    if (this.explorer.options.disableDrag) return;
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
