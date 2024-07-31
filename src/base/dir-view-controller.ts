import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { FStat } from "../filesystem-interface";
import { Fmt } from "../utils/formatters";
import { sortFiles, SortMode } from "./components/dir-view/sort-files";

export interface DirectoryInfo {
  filecount: string;
  dircount: string;
  size: string;
  selection?: {
    filecount: string;
    dircount: string;
    size: string;
  };
}

export class DirViewController {
  public readonly stat = sig<FStat | undefined>(undefined);
  public readonly files = sig<ReadonlyArray<FStat>>([]);
  public readonly sorting = sig({ mode: SortMode.Alpha, reverse: false });
  public readonly selection = sig<ReadonlyArray<FStat>>([]);

  public readonly filesView = this.deriveFilesView();
  public readonly directoryInfo = this.deriveDirectoryInfo();

  constructor(
    protected explorer: Explorer,
  ) {
    const clearSelection = () => {
      this.selection.dispatch([]);
    };
    explorer.onEscapePress(clearSelection);

    // unselect any files that disappear from the view
    this.filesView.add((filesView) => {
      const selected = this.selection.get();
      const visibleSelected: FStat[] = [];
      for (let i = 0; i < selected.length; i++) {
        const sfile = selected[i]!;
        const isVisible = filesView.some(f => f.path === sfile.path);
        if (isVisible) {
          visibleSelected.push(sfile);
        }
      }
      if (visibleSelected.length !== selected.length) {
        this.selection.dispatch(visibleSelected);
      }
    });
  }

  private deriveFilesView() {
    return sig.derive(
      this.files,
      this.sorting,
      (files, sorting) => {
        return sortFiles(
          files.filter(f => !f.hidden),
          sorting.mode,
          sorting.reverse,
        );
      },
    );
  }

  private deriveDirectoryInfo() {
    return sig.derive(
      this.files,
      this.selection,
      (files, selectedFiles): DirectoryInfo => {
        files = files.filter(f => !f.hidden);
        const nonDirs = files.filter(f => !f.directory);
        const totalSize = nonDirs.reduce(
          (totalSize, f) => totalSize + f.size,
          0,
        );

        const slectedNonDirs = selectedFiles.filter(f => !f.directory);
        const selectedSize = slectedNonDirs.reduce(
          (totalSize, f) => totalSize + f.size,
          0,
        );

        return {
          filecount: String(nonDirs.length),
          dircount: String(files.length - nonDirs.length),
          size: Fmt.size(totalSize),
          selection: selectedFiles.length > 0
            ? {
              filecount: String(slectedNonDirs.length),
              dircount: String(selectedFiles.length - slectedNonDirs.length),
              size: Fmt.size(selectedSize),
            }
            : undefined,
        };
      },
    );
  }

  changeDirectory(
    dirStat: FStat,
    files: FStat[],
  ) {
    this.selection.dispatch([]);
    this.stat.dispatch(dirStat);
    this.files.dispatch(files);
  }

  toggleSelectFile(file: FStat) {
    this.selection.dispatch(selected => {
      const idx = selected.findIndex(f => f.path === file.path);
      if (idx !== -1) {
        const copy = selected.slice();
        copy.splice(idx, 1);
        return copy;
      } else {
        return [...selected, file];
      }
    });
  }

  toggleSorting(sortBy: "name" | "date" | "size") {
    this.sorting.dispatch(prev => {
      switch (sortBy) {
        case "name": {
          return {
            mode: SortMode.Alpha,
            reverse: prev.mode === SortMode.Alpha && !prev.reverse,
          };
        }
        case "date": {
          return {
            mode: SortMode.Date,
            reverse: prev.mode === SortMode.Date && !prev.reverse,
          };
        }
        case "size": {
          return {
            mode: SortMode.Size,
            reverse: prev.mode === SortMode.Size && !prev.reverse,
          };
        }
      }
    });
  }
}
