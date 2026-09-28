import { ReadonlySignal, sig, Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { Filesystem, FStat } from "../../../filesystem-interface";
import { getFileIcon } from "../../../utils/get-file-icon";
import { TabController } from "../../tab-controller";
import { useFileEntry } from "./file-entry-common";

function isThumbnailable(file: FStat): boolean {
  if (file.directory) {
    return false;
  }
  const mimetype = file.mimetype?.toLowerCase();
  return mimetype != null
    && (mimetype.startsWith("image/") || mimetype.startsWith("video/"));
}

/**
 * Cache of already fetched thumbnail sources. The virtual list recycles
 * its slots as the user scrolls, which would otherwise result in the same
 * file thumbnails being requested over and over again.
 */
const thumbnailCache = new Map<string, string>();

function requestThumbnail(
  filesystem: Filesystem,
  file: FStat,
  thumbnail: Signal<string | undefined>,
): void {
  const cached = thumbnailCache.get(file.path);
  if (cached) {
    thumbnail.dispatch(cached);
    return;
  }

  filesystem.thumbnail?.(file.path).then(src => {
    if (src) {
      thumbnailCache.set(file.path, src);
      thumbnail.dispatch(src);
    }
  }).catch(err => {
    console.error(err);
  });
}

export function GalleryFileListEntry(
  props: {
    explorer: Explorer;
    tab: TabController;
    file: FStat;
    selectedFiles: ReadonlySignal<readonly FStat[]>;
    activeEntry: ReadonlySignal<string | null>;
    setActiveEntry: (entry: string | null) => void;
  },
) {
  const { explorer } = props;
  const entry = useFileEntry(props);

  const file = props.file;
  const Icon = getFileIcon(file);

  const canThumbnail = explorer.filesystem.thumbnail != null
    && isThumbnailable(file);
  const thumbnail = sig<string>();
  if (canThumbnail) {
    requestThumbnail(explorer.filesystem, file, thumbnail);
  }

  return (
    <div
      class={{
        "active-entry": entry.isActiveEntry,
        "gallery-entry": true,
        selected: entry.isSelected,
        "file-cut": entry.isFileCut,
      }}
      onmouseup={entry.handleMouseUp}
      onmousedown={entry.handleMouseDown}
      onmouseleave={entry.handleMouseLeave}
      oncontextmenu={entry.handleContextMenu}
    >
      <div class="gallery-media">
        {canThumbnail
          ? thumbnail.derive(t => <img src={t} class="gallery-thumbnail" />)
          : <Icon />}
      </div>
      <div class="filename-overlay">
        <span class={[Typography.text, "filename"]}>{file.name}</span>
      </div>
    </div>
  );
}
