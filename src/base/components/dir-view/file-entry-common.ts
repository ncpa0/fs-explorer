import { SignalsReg } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { FileActionContext } from "../../../interfaces/file-action";
import { isLmb } from "../../../utils/events";
import { Path } from "../../../utils/path";
import { TabController } from "../../tab-controller";

export type FileEntryProps = {
  explorer: Explorer;
  tab: TabController;
  /**
   * The file displayed by the entry. Can be provided as a plain value or as
   * a signal, depending on whether the entry needs to support its value
   * being swapped in place (e.g. by a virtual list recycling its slots).
   */
  file: FStat | ReadonlySignal<FStat>;
  selectedFiles: ReadonlySignal<readonly FStat[]>;
  activeEntry: ReadonlySignal<string | null>;
  setActiveEntry: (entry: string | null) => void;
};

export type FileEntry = {
  file: ReadonlySignal<FStat>;
  isSelected: ReadonlySignal<boolean>;
  isActiveEntry: ReadonlySignal<boolean>;
  isFileCut: ReadonlySignal<boolean>;
  handleMouseUp: (event: MouseEvent) => void;
  handleMouseDown: (event: MouseEvent) => void;
  handleMouseLeave: (event: MouseEvent) => void;
  handleContextMenu: (event: MouseEvent) => void;
};

/**
 * Extra margin subtracted from the cached entry rect when deciding whether
 * the pointer has left the entry bounds, so that pixel-edge jitter right at
 * the border does not (or conversely, does) trigger a drag start by accident.
 */
export const DRAG_START_MARGIN = 2;

/**
 * Logic shared between all file entry variants (the list entry and the
 * gallery entry). Handles entry state (selection, active entry, cut state)
 * as well as all the mouse interactions: selecting, opening files and
 * directories, opening context menus and drag and drop.
 */
export function useFileEntry(props: FileEntryProps): FileEntry {
  const { explorer, tab, selectedFiles, activeEntry, setActiveEntry } = props;
  const dir = tab.directory;
  const menu = explorer.contextMenu;
  let isPressed = false;

  const file: ReadonlySignal<FStat> = SignalsReg.isSignal(props.file)
    ? props.file
    : sig(props.file).readonly();

  const isSelected = sig.derive(
    selectedFiles,
    file,
    (selected, file) => selected.some(f => f.path === file.path),
  );

  const isActiveEntry = sig.derive(
    activeEntry,
    file,
    (activeEntry, file) =>
      activeEntry != null && Path.equal(activeEntry, file.path),
  );

  const isFileCut = sig.derive(
    file,
    explorer.clipboard.data,
    (file, clipboard) => {
      if (clipboard.files.length === 0 || clipboard.mode === "copy") {
        return false;
      }
      return clipboard.files.some(f => Path.equal(f.path, file.path));
    },
  );

  const toggleSelect = () => {
    dir.toggleSelectFile(file.get());
  };

  const handleInternalDrop = () => {
    if (!file.get().directory) return;

    const files = explorer.drag.getDraggedFiles();
    explorer.drag.endDrag();

    if (!files || !files.length) return;
    explorer.fs.move(files, file.get().path);
  };

  const handleContextMenu = (event: MouseEvent) => {
    const windowRect = explorer.window!.getBoundingClientRect();
    const left = event.clientX - windowRect.left;
    const top = event.clientY - windowRect.top;
    const bottom = windowRect.height - top;

    const halfPoint = windowRect.height / 2;
    const isBelowHalf = top > halfPoint;

    const selected = selectedFiles.get();
    menu.open({
      triggerFile: file.get(),
      relatedFiles: selected,
      position: {
        left: `min(${left}px, calc(${windowRect.width}px - 13em))`,
        top: isBelowHalf ? undefined : `${top}px`,
        bottom: isBelowHalf ? `${bottom}px` : undefined,
      },
    });
    event.stopPropagation();
    event.preventDefault();
  };

  const handleMouseUp = (event: MouseEvent) => {
    explorer.focusTab(
      tab.id,
    );
    if (!isPressed) {
      if (explorer.drag.isDragging()) {
        handleInternalDrop();
      }
      return;
    }
    isPressed = false;

    if (isLmb(event, "ctrl")) {
      toggleSelect();
      return;
    }

    if (!isLmb(event)) return;

    const f = file.get();

    if (f.directory) {
      tab.open(new Path(f.path));
    } else {
      const actionCtx = new FileActionContext(
        explorer,
        f,
      );
      const action = explorer.options?.openAction?.(f);
      if (action) {
        action(f, actionCtx);
      } else if (explorer.noPreview.get() === false) {
        actionCtx.openPreview();
      }
    }

    setActiveEntry(f.path);

    event.stopPropagation();
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (isLmb(event, "any")) {
      isPressed = true;
    }
  };

  const handleMouseLeave = () => {
    if (isPressed) {
      const selected = selectedFiles.get();
      explorer.drag.startDrag(selected.length != 0 ? selected : [file.get()]);
    }
    isPressed = false;
  };

  return {
    file,
    isSelected,
    isActiveEntry,
    isFileCut,
    handleMouseUp,
    handleMouseDown,
    handleMouseLeave,
    handleContextMenu,
  };
}
