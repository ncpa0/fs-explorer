import { VirtualList } from "@ncpa0cpl/vanilla-jsx";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { TabController } from "../../tab-controller";
import { FileListEntry } from "./files-list-entry";

export type VirtualFileListProps = {
  explorer: Explorer;
  tab: TabController;
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
      pageSize={32}
      overscanTrailing={1024}
      overscanLeading={4096}
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
  );

  dir.onContentChange = scrollPos => {
    list.scrollTo({ top: scrollPos, behavior: "instant" });
  };

  return list;
}
