import { $component } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Typography } from "adwavecss";
import throttle from "lodash.throttle";
import { Explorer } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { chunks } from "../../../utils/chunks";
import { ADW } from "../../../utils/css";
import { Memo } from "../_common/memo";
import { FileListEntry } from "./files-list-entry";
import { FileViewHeader } from "./list-header";

export type VirtualFileListProps = {
  explorer: Explorer;
  files: ReadonlySignal<FStat[]>;
  selectedFiles: ReadonlySignal<readonly FStat[]>;
};

export const VirtualFileList = $component(
  function VirtualFileList(props: VirtualFileListProps, api) {
    const { explorer } = props;
    const dir = explorer.directory;

    const pageInView = sig(0);
    const pages = props.files.derive((files) => {
      return chunks(files, 30);
    });

    const setActiveEntry = (entry: FStat | null) => {
      dir.activeEntry.dispatch(entry);
    };

    api.onChange(() => {
      pageInView.dispatch(0);
      scrollview.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [props.files]);

    const observerHandler = throttle(
      (entries: IntersectionObserverEntry[]) => {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i]!;
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            if (element.dataset.page) {
              const pageIdx = Number(element.dataset.page);
              if (!Number.isNaN(pageIdx)) {
                pageInView.dispatch(pageIdx);
                return;
              }
            }
          }
        }
      },
      25,
      { trailing: true },
    );

    const scrollview = (
      <div
        class={{
          [ADW.Box.box]: true,
          [ADW.Box.bg2]: true,
          "dir-view": true,
          empty: props.files.derive((files) => files.length === 0),
          hidden: dir.loading,
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
    );

    const visiblePagesObserver = new IntersectionObserver(
      observerHandler,
      { threshold: 0.51, root: scrollview },
    );
    const hiddenPagesObserver = new IntersectionObserver(
      observerHandler,
      { threshold: 0.01, root: scrollview },
    );

    const pagesElements = (
      <div class="dcontents">
        {sig.derive(pages, pageInView, (pages, pageInView) => {
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
                        activeEntry={dir.activeEntry}
                        setActiveEntry={setActiveEntry}
                        explorer={props.explorer}
                        selectedFiles={props.selectedFiles}
                        file={file}
                      />
                    );
                  })}
                  <Observable
                    observer={visiblePagesObserver}
                    data={String(idx)}
                  />
                  {secondHalf.map((file) => {
                    return (
                      <FileListEntry
                        activeEntry={dir.activeEntry}
                        setActiveEntry={setActiveEntry}
                        explorer={props.explorer}
                        selectedFiles={props.selectedFiles}
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
                {Math.abs(pageInView - idx) > 2
                  ? (
                    <Memo cacheKey={"empty-observable-" + String(idx)}>
                      <Observable
                        observer={hiddenPagesObserver}
                        fill={true}
                        data={String(idx)}
                      />
                    </Memo>
                  )
                  : (renderPage())}
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
  props: { observer: IntersectionObserver; data: string; fill?: boolean },
  api,
) {
  const className = props.fill ? "page-filler" : "";

  const element = <span class={className} data-page={props.data}></span>;

  api.onMount(() => {
    props.observer.observe(element);
    return () => {
      props.observer.unobserve(element);
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
