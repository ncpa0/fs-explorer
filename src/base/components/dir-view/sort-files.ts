import { FStat } from "../../../filesystem-interface";
import { collator } from "../../../utils/collator";
import { mimeName } from "../../../utils/mime-name";
import { Path } from "../../../utils/path";

export enum SortMode {
  Alpha,
  Size,
  Date,
  Type,
}

/**
 * Shared by the Type column display and the SortMode.Type sort key - the
 * two must use the same value or the column reads unordered when sorted
 * by type.
 */
export function fileTypeLabel(file: FStat): string {
  if (file.directory) {
    return "Directory";
  }
  return mimeName(file.mimetype ?? "")
    ?? Path.ext(file.name)?.toUpperCase()
    ?? "";
}

function SortAlhpa(a: FStat, b: FStat): number {
  return collator.compare(a.name, b.name);
}

function SortAlphaReverse(a: FStat, b: FStat): number {
  return SortAlhpa(b, a);
}

function SortSize(a: FStat, b: FStat): number {
  return a.size - b.size;
}

function SortSizeReverse(a: FStat, b: FStat): number {
  return SortSize(b, a);
}

function SortDate(a: FStat, b: FStat): number {
  return a.mtime - b.mtime;
}

function SortDateReverse(a: FStat, b: FStat): number {
  return SortDate(b, a);
}

function SortType(a: FStat, b: FStat): number {
  const byType = collator.compare(fileTypeLabel(a), fileTypeLabel(b));
  return byType !== 0 ? byType : collator.compare(a.name, b.name);
}

function SortTypeReverse(a: FStat, b: FStat): number {
  return SortType(b, a);
}

export function sortFiles(
  data: readonly FStat[],
  mode: SortMode,
  reverse = false,
): FStat[] {
  const dirs: FStat[] = [];
  const files: FStat[] = [];

  for (let i = 0; i < data.length; i++) {
    const file = data[i]!;
    if (file.directory) {
      dirs.push(file);
    } else {
      files.push(file);
    }
  }

  let sortFn: (a: FStat, b: FStat) => number;
  switch (mode) {
    case SortMode.Alpha:
      sortFn = reverse ? SortAlphaReverse : SortAlhpa;
      break;
    case SortMode.Size:
      sortFn = reverse ? SortSizeReverse : SortSize;
      break;
    case SortMode.Date:
      sortFn = reverse ? SortDateReverse : SortDate;
      break;
    case SortMode.Type:
      sortFn = reverse ? SortTypeReverse : SortType;
  }

  dirs.sort(sortFn);
  files.sort(sortFn);

  return dirs.concat(files);
}
