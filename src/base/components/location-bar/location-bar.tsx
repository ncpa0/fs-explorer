import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../../..";
import ArrowBackwardIcon from "../../../assets/main-theme/icons/arrow-back.svg";
import ArrowForwardIcon from "../../../assets/main-theme/icons/arrow-forward.svg";
import ArrowUpIcon from "../../../assets/main-theme/icons/arrow-up.svg";
import { ADW } from "../../../utils/css";
import { Path } from "../../../utils/path";
import { ExplorerLocation } from "../../history";

export type LocationBarProps = {
  explorer: Explorer;
};

enum BarMode {
  Preview = "preview",
  Edit = "edit",
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
    const newPath = new Path(input.value.trim());
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

function ControlButtons(props: {
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
}) {
  return (
    <div class={["control-buttons"]}>
      <button
        onmousedown={props.onBack}
        class={[ADW.Button.button, ADW.Button.flat, ADW.Button.square]}
      >
        <span class={["control-icon", ADW.Typography.text]}>
          <ArrowBackwardIcon />
        </span>
      </button>
      <button
        onmousedown={props.onForward}
        class={[ADW.Button.button, ADW.Button.flat, ADW.Button.square]}
      >
        <span class={["control-icon", ADW.Typography.text]}>
          <ArrowForwardIcon />
        </span>
      </button>
      <button
        onmousedown={props.onUp}
        class={[ADW.Button.button, ADW.Button.flat, ADW.Button.square]}
      >
        <span class={["control-icon", ADW.Typography.text]}>
          <ArrowUpIcon />
        </span>
      </button>
    </div>
  );
}

export function LocationBar(props: LocationBarProps) {
  const { explorer } = props;
  const location = ExplorerLocation.signal(explorer.location);
  const mode = sig(BarMode.Preview);

  const handleSegmentClick = (segmentPath: Path) => {
    explorer.open(segmentPath);
  };

  const handleEditorSubmit = (path: Path) => {
    explorer.open(path);
    if (!path.equals(explorer.location.pathname)) {
      mode.dispatch(BarMode.Preview);
    }
  };

  return (
    <div class={["location-bar"]}>
      <ControlButtons
        onBack={() => explorer.history.back()}
        onForward={() => explorer.history.forward()}
        onUp={() => {
          const p = explorer.location.path;
          const up = p.base();
          if (!up.equals(p)) {
            explorer.history.push(up);
          }
        }}
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
}
