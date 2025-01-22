import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { FStat } from "../filesystem-interface";

export class DragController {
  private draggedFiles = sig<readonly FStat[] | null>(null);

  isDragging() {
    return this.draggedFiles.derive(f => f != null);
  }

  startDrag(files: readonly FStat[]) {
    this.draggedFiles.dispatch(files);
  }

  endDrag() {
    this.draggedFiles.dispatch(null);
  }

  getDraggedFiles() {
    return this.draggedFiles.get();
  }
}
