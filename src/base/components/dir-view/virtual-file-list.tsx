import { $component } from "@ncpa0cpl/vanilla-jsx";
import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { chunks } from "../../../utils/chunks";
import { ADW } from "../../../utils/css";
import { TabController } from "../../tab-controller";
import { Memo } from "../_common/memo";
import { FileListEntry } from "./files-list-entry";
import { FileViewHeader } from "./list-header";

export type VirtualFileListProps = {
  explorer: Explorer;
  tab: TabController;
};

export const VirtualFileList = $component(
  function VirtualFileList(props: VirtualFileListProps, api) {
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
            return { visiblePages: newVisible };
          });
        }
        return;
      }
    };

    const scrollview = (
      <div
        class={{
          [ADW.ScrollView.scrollView]: true,
          "dir-view": true,
          empty: files.derive((files) => files.length === 0),
        }}
      >
        {dir.filesView.derive(files => {
          if (files.length === 0) {
            return (
              <div class="empty-dir-msg">
                <span class={[Typography.subtitle]}>
                  This directory is empty.
                </span>
              </div>
            );
          }

          return <FileViewHeader sorting={dir.sorting} dir={dir} />;
        })}
        <Gap />
      </div>
    ) as HTMLDivElement;

    scrollview.onscroll = e => {
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
              const halfPoint = Math.floor(page.length / 2);
              const firstHalf = page.slice(0, halfPoint);
              const secondHalf = page.slice(halfPoint, 30);

              const pageElement = (
                <div class={`dir-page dcontents page-${idx}`}>
                  {firstHalf.map((file) => {
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
                  })}
                  <Memo
                    cacheKey={"page-observable-" + String(idx)}
                    dependencies={[observerHandler]}
                  >
                    {() => (
                      <Observable
                        root={scrollview}
                        threshold={0.51}
                        onIntersect={observerHandler}
                        fill={false}
                        data={String(idx)}
                      />
                    )}
                  </Memo>
                  {secondHalf.map((file) => {
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
                  })}
                </div>
              );

              return pageElement;
            };

            return (
              <div class="dcontents">
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
                          fill={true}
                          data={String(idx)}
                        />
                      ),
                    });
                  })}
              </div>
            );
          });
        })}
      </div>
    );

    scrollview.appendChild(pagesElements);
    scrollview.appendChild(<Gap />);

    return scrollview;
  },
);

const Observable = $component(function Observable(
  props: {
    data: string;
    fill?: boolean;
    threshold?: number;
    root?: HTMLElement;
    onIntersect: (data: string) => void;
  },
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

  const className = props.fill ? "page-filler" : "";

  const element = <span class={className} data-page={props.data}></span>;

  api.onMount(() => {
    observer.observe(element);
    return () => {
      observer.unobserve(element);
    };
  });

  return (
    <div class={`dcontents observable data-${props.data}`}>
      <span class={className} />
      {element}
      <span class={className} />
      <span class={className} />
    </div>
  );
});

function Gap() {
  return (
    <>
      <div class="gaper" />
      <div class="gaper" />
      <div class="gaper" />
      <div class="gaper" />
    </>
  );
}
