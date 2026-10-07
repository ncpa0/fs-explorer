import { FStat } from "../../../filesystem-interface";
import { collator } from "../../../utils/collator";
import { Path } from "../../../utils/path";

export enum SortMode {
  Alpha,
  Size,
  Date,
  Type,
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
  const aType = Path.ext(a.name) ?? a.mimetype ?? "";
  const bType = Path.ext(b.name) ?? b.mimetype ?? "";
  return collator.compare(aType, bType);
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
