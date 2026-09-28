import { $component, Range, VirtualList } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { chunks } from "../../../utils/chunks";
import { ADW } from "../../../utils/css";
import { TabController } from "../../tab-controller";
import { Memo } from "../_common/memo";
import { GalleryFileListEntry } from "./gallery-file-list-entry";

/**
 * Width taken up by a single gallery entry, in em units. This includes the
 * entry itself and its surrounding margins.
 */
const GALLERY_ITEM_SIZE_EM = 9;
const GALLERY_INLINE_MARGIN_EM = 1;

export type GalleryFileListProps = {
  explorer: Explorer;
  tab: TabController;
};

export const GalleryFileList = $component(function GalleryFileList(
  props: GalleryFileListProps,
  api,
) {
  const { tab, explorer } = props;
  const dir = tab.directory;
  const files = dir.filesView.readonly();
  const selectedFiles = dir.selection.readonly();

  /**
   * Amount of entries to place in a single row. Adjusted by the resize
   * observer so that all entries always fit within the container.
   */
  const itemsPerRow = sig(1);

  const rows = sig.derive(
    dir.filesView,
    itemsPerRow,
    (files, perRow) => chunks(files.slice(), perRow),
  );

  const setActiveEntry = (entry: string | null) => {
    dir.activeEntry.dispatch(entry);
  };

  const list = (
    <VirtualList
      data={rows}
      getKey={row => row.map(f => f.path).join("\u0000")}
      pageSize={24}
      overscanTrailing={2000}
      overscanLeading={9000}
      bailThreshold={3000}
      estimateItemHeight={190}
      itemHeight="homogeneous"
      onscroll={(_, pos) => {
        tab.history.setCurrentScrollPosition(pos);
      }}
      containerProps={{
        class: {
          [ADW.ScrollView.scrollView]: true,
          "dir-view": true,
          "gallery-view": true,
          empty: files.derive(files => files.length === 0),
        },
      }}
      renderEmpty={() => (
        <div class="empty-dir-msg">
          <span class={[Typography.subtitle]}>
            This directory is empty.
          </span>
        </div>
      )}
      render={(row) => {
        return (
          <GalleryRow
            row={row}
            explorer={explorer}
            tab={tab}
            activeEntry={dir.activeEntry}
            setActiveEntry={setActiveEntry}
            selectedFiles={selectedFiles}
          />
        );
      }}
    />
  );

  const updateItemsPerRow = () => {
    const fontSize = parseFloat(getComputedStyle(list).fontSize);
    if (Number.isNaN(fontSize) || fontSize <= 0) return;

    const width = list.clientWidth - (GALLERY_INLINE_MARGIN_EM * fontSize);
    if (!width) return;

    const perRow = Math.max(
      1,
      Math.floor(
        width / (GALLERY_ITEM_SIZE_EM * fontSize),
      ),
    );
    if (perRow !== itemsPerRow.get()) {
      itemsPerRow.dispatch(perRow);
    }
  };

  api.onMount(() => {
    const observer = new ResizeObserver(updateItemsPerRow);
    observer.observe(list);
    updateItemsPerRow();
    return () => {
      observer.disconnect();
    };
  });

  dir.onContentChange = scrollPos => {
    list.scrollTo({ top: scrollPos, behavior: "instant" });
  };

  return list;
});

function GalleryRow(
  props: {
    row: ReadonlySignal<readonly FStat[]>;
    explorer: Explorer;
    tab: TabController;
    activeEntry: ReadonlySignal<string | null>;
    setActiveEntry: (entry: string | null) => void;
    selectedFiles: ReadonlySignal<readonly FStat[]>;
  },
) {
  return (
    <Range
      data={props.row}
      into={<div class="gallery-row" />}
      children={file => {
        return (
          <div class="gallery-file-list-entry-wrapper">
            <Memo
              cacheKey={`GalleryFileListEntry_${file.path}`}
              children={() => (
                <GalleryFileListEntry
                  explorer={props.explorer}
                  tab={props.tab}
                  file={file}
                  activeEntry={props.activeEntry}
                  setActiveEntry={props.setActiveEntry}
                  selectedFiles={props.selectedFiles}
                />
              )}
              dependencies={[
                props.tab,
                props.activeEntry,
                props.setActiveEntry,
                props.selectedFiles,
              ]}
            />
          </div>
        );
      }}
    />
  );
}
