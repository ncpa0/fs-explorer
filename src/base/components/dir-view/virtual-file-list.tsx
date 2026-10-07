import { VirtualList } from "@ncpa0cpl/vanilla-jsx";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { ADW } from "../../../utils/css";
import { Path } from "../../../utils/path";
import { TabController } from "../../tab-controller";
import { FileListEntry } from "./files-list-entry";

export type VirtualFileListProps = {
  explorer: Explorer;
  tab: TabController;
};

export type VirtualListElement<T> = HTMLDivElement & {
  VirtualList: VirtualList<T>;
};

export function VirtualFileList(
  props: VirtualFileListProps,
) {
  const { tab, explorer } = props;
  const dir = tab.directory;
  const files = dir.filesView.readonly();
  const selectedFiles = dir.selection.readonly();

  const setActiveEntry = (entry: string | null) => {
    dir.activeEntry.dispatch(entry);
  };

  const list = (
    <VirtualList
      data={dir.filesView}
      getKey={f => f.path}
      pageSize={24}
      overscanTrailing={2000}
      overscanLeading={9000}
      bailThreshold={3000}
      estimateItemHeight={47}
      itemHeight="homogeneous"
      onscroll={(_, pos) => {
        tab.history.setCurrentScrollPosition(pos);
      }}
      containerProps={{
        class: {
          [ADW.ScrollView.scrollView]: true,
          "dir-view": true,
          empty: files.derive((files) => files.length === 0),
        },
      }}
      renderEmpty={() => (
        <div class="empty-dir-msg">
          <span class={[Typography.subtitle]}>
            This directory is empty.
          </span>
        </div>
      )}
      render={(file) => {
        return (
          <FileListEntry
            tab={tab}
            explorer={explorer}
            activeEntry={dir.activeEntry}
            setActiveEntry={setActiveEntry}
            selectedFiles={selectedFiles}
            file={file}
          />
        );
      }}
    />
  ) as VirtualListElement<FStat>;

  dir.onContentChange = scrollPos => {
    list.scrollTo({ top: scrollPos, behavior: "instant" });
  };

  dir.scrollToFile = (filepath) => {
    filepath = Path.from(filepath);

    const idx = dir.filesView.get().findIndex(f => filepath.equals(f.path));

    if (idx >= 0) {
      list.VirtualList.scrollToItem(idx, { behavior: "instant" });
    }
  };

  return list;
}
