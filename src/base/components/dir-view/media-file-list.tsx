import { $component } from "@ncpa0cpl/vanilla-jsx";
import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { chunks } from "../../../utils/chunks";
import { ADW } from "../../../utils/css";
import { TabController } from "../../tab-controller";
import { Memo } from "../_common/memo";
import { MediaFileListEntry } from "./media-file-list-entry";

export type MediaFileListProps = {
  explorer: Explorer;
  tab: TabController;
};

export function MediaFileList(
  props: MediaFileListProps,
) {
  const { tab, explorer } = props;
  const dir = tab.directory;
  const files = dir.filesView.readonly();
  const selectedFiles = dir.selection.readonly();

  const viewState = sig({
    visiblePages: new Set([0]),
  });
  const pages = files.derive((files) => {
    return chunks(files, 30);
  });

  const setActiveEntry = (entry: FStat | null) => {
    dir.activeEntry.dispatch(entry);
  };

  const observerHandler = (page: string) => {
    const pageIdx = Number(page);
    if (!Number.isNaN(pageIdx)) {
      const newVisible = new Set(viewState.get().visiblePages);
      newVisible.add(pageIdx - 3);
      newVisible.add(pageIdx - 2);
      newVisible.add(pageIdx - 1);
      newVisible.add(pageIdx);
      newVisible.add(pageIdx + 1);
      newVisible.add(pageIdx + 2);
      newVisible.add(pageIdx + 3);

      if (newVisible.size !== viewState.get().visiblePages.size) {
        viewState.dispatch(current => {
          return { ...current, visiblePages: newVisible };
        });
      }
      return;
    }
  };

  const scrollview = (
    <div
      class={{
        [ADW.ScrollView.scrollView]: true,
        "media-dir-view": true,
        empty: files.derive((files) => files.length === 0),
      }}
    >
      {dir.filesView.derive((files) => {
        if (files.length === 0) {
          return (
            <div class="empty-dir-msg">
              <span class={[Typography.subtitle]}>
                This directory is empty.
              </span>
            </div>
          );
        }

        return null;
      })}
    </div>
  ) as HTMLDivElement;

  scrollview.onscroll = () => {
    const yPos = scrollview.scrollTop;
    tab.history.setCurrentScrollPosition(yPos);
  };
  dir.onContentChange = scrollPos => {
    scrollview.scrollTo({ top: scrollPos, behavior: "instant" });
  };

  const pagesElements = (
    <div class="dcontents">
      {pages.derive((pages) => {
        return pages.map((page, idx) => {
          const renderPage = () => {
            const [first, ...rest] = page;

            return (
              <div class={`page dcontents`}>
                <Observable
                  root={scrollview}
                  threshold={0.51}
                  onIntersect={observerHandler}
                  data={String(idx)}
                >
                  <MediaFileListEntry
                    tab={tab}
                    explorer={explorer}
                    activeEntry={dir.activeEntry}
                    setActiveEntry={setActiveEntry}
                    selectedFiles={selectedFiles}
                    file={first!}
                  />
                </Observable>
                {rest.map((file) => {
                  return (
                    <MediaFileListEntry
                      tab={tab}
                      explorer={explorer}
                      activeEntry={dir.activeEntry}
                      setActiveEntry={setActiveEntry}
                      selectedFiles={selectedFiles}
                      file={file}
                    />
                  );
                })}
              </div>
            );
          };

          return (
            <>
              {viewState
                .derive(({ visiblePages: viewed }) => {
                  const shouldRender = viewed.has(idx);
                  return shouldRender;
                })
                .derive(shouldRender => {
                  if (shouldRender) {
                    return renderPage();
                  }

                  return Memo({
                    cacheKey: "empty-observable-" + String(idx),
                    dependencies: [observerHandler],
                    children: () => (
                      <Observable
                        root={scrollview}
                        threshold={0.1}
                        onIntersect={observerHandler}
                        data={String(idx)}
                      />
                    ),
                  });
                })}
            </>
          );
        });
      })}
    </div>
  );

  scrollview.appendChild(pagesElements);

  return scrollview;
}

const Observable = $component(function Observable(
  props: JSX.PropsWithChildren<{
    data: string;
    threshold?: number;
    root?: HTMLElement;
    onIntersect: (data: string) => void;
  }>,
  api,
) {
  const observer = new IntersectionObserver((e) => {
    const elem = e[0]!;
    if (elem.isIntersecting) {
      props.onIntersect(props.data);
    }
  }, {
    root: props.root,
    threshold: props.threshold ?? 0.5,
  });

  const element = (
    <div class="observable" data-page={props.data}>
      {props.children}
    </div>
  );

  api.onMount(() => {
    observer.observe(element);
    return () => {
      observer.unobserve(element);
    };
  });

  return element;
});
