import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import ArrowBackwardIcon from "../../../assets/main-theme/icons/arrow-back.svg";
import ArrowForwardIcon from "../../../assets/main-theme/icons/arrow-forward.svg";
import ArrowUpIcon from "../../../assets/main-theme/icons/arrow-up.svg";
import RefreshIcon from "../../../assets/main-theme/icons/refresh.svg";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { Path } from "../../../utils/path";

export type LocationBarProps = {
  explorer: Explorer;
};

enum BarMode {
  Preview = "preview",
  Edit = "edit",
}

export function LocationBar(props: LocationBarProps) {
  const { explorer } = props;
  return sig.derive(explorer.activeTab, explorer.tabs, (tabID, allTabs) => {
    const tab = allTabs.find(t => t.id === tabID) ?? allTabs[0]!;
    const location = tab.location.signal;
    const mode = sig(BarMode.Preview);

    const handleSegmentClick = (segmentPath: Path) => {
      tab.open(segmentPath);
    };

    const handleEditorSubmit = (path: Path) => {
      tab.open(path);
      if (!path.equals(tab.location.pathname)) {
        mode.dispatch(BarMode.Preview);
      }
    };

    const handleBack = () => {
      tab.history.back();
    };

    const handleForward = () => {
      tab.history.forward();
    };

    const handleUp = () => {
      const p = tab.location.path;
      const up = p.base();
      if (!up.equals(p)) {
        const prevScrollPos = tab.history.getEntry(-1)?.scrollPosition;
        tab.history.push(up, prevScrollPos);
      }
    };

    return (
      <div class={["location-bar", ADW.Box.box, ADW.Box.bg2]}>
        <ControlButtons
          onBack={handleBack}
          onForward={handleForward}
          onUp={handleUp}
          onReload={() => tab.refresh()}
          onGoHome={() => tab.open("/")}
        />
        {mode.derive(m => {
          if (m === BarMode.Preview) {
            return (
              <LocationPreview
                location={location}
                changeMode={() => mode.dispatch(BarMode.Edit)}
                onSegmentClick={handleSegmentClick}
              />
            );
          } else {
            return (
              <LocationEditor
                location={location}
                changeMode={() => mode.dispatch(BarMode.Preview)}
                onSubmit={handleEditorSubmit}
              />
            );
          }
        })}
      </div>
    );
  });
}

function ControlButtons(props: {
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onReload: () => void;
  onGoHome: () => void;
}) {
  return (
    <div class={["control-buttons"]}>
      <button
        onmousedown={props.onBack}
        class={[
          ADW.Button.button,
          ADW.Button.flat,
          ADW.Button.square,
          ADW.Button.adaptive,
        ]}
      >
        <span class={["control-icon", ADW.Typography.text]}>
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
        <span class={["control-icon", ADW.Typography.text]}>
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
        <span class={["control-icon", ADW.Typography.text]}>
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
        <span class={["control-icon", ADW.Typography.text]}>
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

  return (
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
        Root
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
