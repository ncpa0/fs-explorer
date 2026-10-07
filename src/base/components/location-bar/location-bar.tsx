import { bindSignal } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import ArrowBackwardIcon from "../../../assets/main-theme/icons/arrow-back.svg";
import ArrowForwardIcon from "../../../assets/main-theme/icons/arrow-forward.svg";
import ArrowUpIcon from "../../../assets/main-theme/icons/arrow-up.svg";
import PlusIcon from "../../../assets/main-theme/icons/plus.svg";
import RefreshIcon from "../../../assets/main-theme/icons/refresh.svg";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { Path } from "../../../utils/path";
import { DirectoryOptionsButton } from "../left-pane/explorer-actions-menu";

export type LocationBarProps = {
  explorer: Explorer;
};

enum BarMode {
  Preview = "preview",
  Edit = "edit",
}

export function LocationBar(props: LocationBarProps) {
  const { explorer } = props;

  const tab = explorer.currentTab;
  const mode = sig(BarMode.Preview);
  const tabPath = explorer.location.derive(l => l.signal);

  const handleSegmentClick = (segmentPath: Path) => {
    tab.get().open(segmentPath);
  };

  const handleEditorSubmit = (path: Path) => {
    tab.get().open(path);
    if (!path.equals(tab.get().location.pathname)) {
      mode.dispatch(BarMode.Preview);
    }
  };

  const handleBack = () => {
    tab.get().history.back();
  };

  const handleForward = () => {
    tab.get().history.forward();
  };

  const handleUp = () => {
    tab.get().history.backPush();
  };

  const handleNewTab = () => {
    explorer.newTabGroup(tab.get().location.path);
  };

  return (
    <div class={["location-bar", ADW.Box.box, ADW.Box.bg2]}>
      <ControlButtons
        explorer={explorer}
        onBack={handleBack}
        onForward={handleForward}
        onUp={handleUp}
        onReload={() => tab.get().refresh()}
        onGoHome={() => tab.get().open("/")}
      />
      {mode.derive(m => {
        if (m === BarMode.Preview) {
          return (
            <LocationPreview
              location={tabPath}
              changeMode={() => mode.dispatch(BarMode.Edit)}
              onSegmentClick={handleSegmentClick}
            />
          );
        } else {
          return (
            <LocationEditor
              location={tabPath}
              changeMode={() => mode.dispatch(BarMode.Preview)}
              onSubmit={handleEditorSubmit}
            />
          );
        }
      })}
      <button
        onmousedown={handleNewTab}
        class={[
          ADW.Button.button,
          ADW.Button.square,
          ADW.Button.adaptive,
          "new-tab-btn",
          "btn-with-icon",
          ADW.Typography.text,
        ]}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function ControlButtons(props: {
  explorer: Explorer;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onReload: () => void;
  onGoHome: () => void;
}) {
  return (
    <div class={["control-buttons"]}>
      {props.explorer.hideLeftPane.derive((show) =>
        show ? <DirectoryOptionsButton explorer={props.explorer} /> : <></>
      )}
      <button
        onmousedown={props.onBack}
        class={[
          ADW.Button.button,
          ADW.Button.flat,
          ADW.Button.square,
          ADW.Button.adaptive,
        ]}
      >
        <span class={["btn-with-icon", ADW.Typography.text]}>
          <ArrowBackwardIcon />
        </span>
      </button>
      <button
        onmousedown={props.onForward}
        class={[
          ADW.Button.button,
          ADW.Button.flat,
          ADW.Button.square,
          ADW.Button.adaptive,
        ]}
      >
        <span class={["btn-with-icon", ADW.Typography.text]}>
          <ArrowForwardIcon />
        </span>
      </button>
      <button
        onmousedown={props.onUp}
        class={[
          ADW.Button.button,
          ADW.Button.flat,
          ADW.Button.square,
          ADW.Button.adaptive,
        ]}
      >
        <span class={["btn-with-icon", ADW.Typography.text]}>
          <ArrowUpIcon />
        </span>
      </button>
      <button
        onmousedown={props.onReload}
        class={[
          ADW.Button.button,
          ADW.Button.flat,
          ADW.Button.square,
          ADW.Button.adaptive,
        ]}
      >
        <span class={["btn-with-icon", ADW.Typography.text]}>
          <RefreshIcon />
        </span>
      </button>
    </div>
  );
}

function LocationPreview(
  props: {
    location: ReadonlySignal<Path>;
    changeMode: () => void;
    onSegmentClick: (segmentPath: Path) => void;
  },
) {
  const isInRoot = props.location.derive(loc => loc.segments().length === 0);

  const handleSegmentClick = (allSegment: string[], idx: number) => {
    const newSegments = allSegment.slice(0, idx + 1);
    props.onSegmentClick(Path.from(newSegments));
  };

  const handleOutsideClick = (ev: MouseEvent) => {
    if (ev.target === ev.currentTarget) {
      props.changeMode();
    }
  };

  const preview = (
    <div
      class={["breadcrumbs", "location-preview"]}
      onmousedown={handleOutsideClick}
    >
      <div
        class={{
          "breadcrumb-item": true,
          active: isInRoot,
          activable: isInRoot.derive(x => !x),
        }}
        onmousedown={() => {
          if (!isInRoot.get()) {
            handleSegmentClick([], 0);
          }
        }}
      >
        {props.location.derive(loc => loc.scheme() ?? "Root")}
      </div>
      <div class="breadcrumb-separator"></div>
      {props.location.derive(loc => {
        const segments = loc.segments();
        return segments.flatMap((segment, idx) => {
          const isLast = idx === segments.length - 1;

          if (isLast) {
            return <div class="breadcrumb-item active">{segment}</div>;
          }

          return [
            <div
              class="breadcrumb-item activable"
              onmousedown={() => handleSegmentClick(segments, idx)}
            >
              {segment}
            </div>,
            <div class="breadcrumb-separator"></div>,
          ];
        });
      })}
    </div>
  );

  bindSignal(props.location, preview, (elem) => {
    setTimeout(() => {
      // scroll all the way to the right
      elem.scrollTo({
        behavior: "smooth",
        left: elem.scrollWidth,
      });
    });
  });

  return preview;
}

function LocationEditor(
  props: {
    location: ReadonlySignal<Path>;
    changeMode: () => void;
    onSubmit: (path: Path) => void;
  },
) {
  const handleChange = (ev: Event) => {
    const input = ev.target as HTMLInputElement;
    const newPath = new Path(input.value.trim()).normalize();
    props.onSubmit(newPath);
  };

  const handleKeyDown = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case "Escape":
        props.changeMode();
        break;
    }
  };

  const handleBlur = () => {
    props.changeMode();
  };

  setTimeout(() => {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, 20);

  const input = (
    <input
      class={[ADW.Input.input, "location-editor"]}
      value={props.location.get().toString()}
      onchange={handleChange}
      onkeydown={handleKeyDown}
      onblur={handleBlur}
    />
  ) as HTMLInputElement;
  return input;
}
