import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../../explorer";

export type ListColumnId = "size" | "type" | "modified";

export type ListColumn = {
  id: ListColumnId;
  width: string;
  headerClass: string;
  headerLabel: string;
  sortBy: "size" | "type" | "date";
  cellClass: string;
  visibility: (explorer: Explorer) => ReadonlySignal<boolean>;
};

/**
 * Single source of truth for the optional file-list columns: their order,
 * grid widths and which setting controls their visibility. The header and
 * the file entries render their cells from this list, and the
 * `--dirview-cols` grid template is derived from it - adding, removing or
 * reordering a column must be done here so the three stay in sync. The
 * `--dirview-cols` derive in dir-view.tsx passes the visibility signals
 * positionally and must list them in this array's order.
 */
export const LIST_COLUMNS: readonly ListColumn[] = [
  {
    id: "size",
    width: "7em",
    headerClass: "header-size",
    headerLabel: "Size",
    sortBy: "size",
    cellClass: "file-size",
    visibility: (explorer) => explorer.userSettings.showSizeColumn,
  },
  {
    id: "type",
    width: "10em",
    headerClass: "header-type",
    headerLabel: "Type",
    sortBy: "type",
    cellClass: "file-type",
    visibility: (explorer) => explorer.userSettings.showTypeColumn,
  },
  {
    id: "modified",
    width: "12em",
    headerClass: "header-date",
    headerLabel: "Date Modified",
    sortBy: "date",
    cellClass: "file-modified",
    visibility: (explorer) => explorer.userSettings.showModifiedColumn,
  },
];
