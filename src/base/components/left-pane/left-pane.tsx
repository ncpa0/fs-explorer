import { Separator } from "adwavecss";
import DirectoryIcon from "../../../assets/main-theme/icons/directory.svg";
import MoreIcon from "../../../assets/main-theme/icons/more.svg";
import { Explorer, Place } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { isLmb } from "../../../utils/events";
import { getRelativePosition } from "../../../utils/get-relative-position";
import { JobsView } from "../jobs/jobs-view";
import { PlaceContextMenu } from "./place-context-menu";

export type LeftPaneProps = {
  explorer: Explorer;
};

export function LeftPane(props: LeftPaneProps) {
  const { explorer } = props;
  const { staticPlaces, overlay } = explorer;
  const places = explorer.places.list();
  const tabPath = explorer.location.derive(l => l.signal);

  const handleOpenOptions = () => {
    const window = explorer.window!;

    const btnRelPos = getRelativePosition(optionsBtn, window);
    const btnSize = optionsBtn.getBoundingClientRect();

    overlay.display(
      {
        dimBackground: false,
        position: {
          top: btnRelPos.top + btnSize.height + 6,
          left: btnRelPos.left,
        },
      },
      <OptionsMenu explorer={explorer} close={() => overlay.close()} />,
    );
  };

  const handlePlaceClick = (place: Place) => {
    explorer.open(place.path);
  };

  const optionsBtn = (
    <button
      class={{
        "options-btn": true,
        [ADW.Button.button]: true,
        [ADW.Button.flat]: true,
        [ADW.Button.square]: true,
        [ADW.Button.adaptive]: true,
      }}
      onmousedown={handleOpenOptions}
    >
      <MoreIcon />
    </button>
  );

  const openPlaceContextMenu = (event: MouseEvent, place: Place) => {
    event.preventDefault();
    event.stopPropagation();

    const windowRect = explorer.window!.getBoundingClientRect();
    const left = event.clientX - windowRect.left;
    const top = event.clientY - windowRect.top;
    const bottom = windowRect.height - top;

    const halfPoint = windowRect.height / 2;
    const isBelowHalf = top > halfPoint;

    explorer.overlay.display(
      {
        dimBackground: false,
        closeOnBackgroundClick: true,
        position: {
          left: `min(${left}px, calc(${windowRect.width}px - 13em))`,
          top: isBelowHalf ? undefined : `${top}px`,
          bottom: isBelowHalf ? `${bottom}px` : undefined,
        },
      },
      <PlaceContextMenu
        explorer={explorer}
        place={place}
      />,
    );
  };

  return (
    <div
      class={{
        "left-pane": true,
        [ADW.Box.box]: true,
        [ADW.Box.bg3]: true,
        hidden: explorer.hideLeftPane,
      }}
    >
      <div class="places scrollview">
        <div class={"pane-header"}>
          <span class={[ADW.Typography.text, "header-title"]}>Places</span>
          {optionsBtn}
        </div>
        <div class={["left-pane-places", "scrollview"]}>
          {places.derive(places => {
            return places.flatMap(place => (
              <button
                id={`place-${place.id}`}
                class={{
                  "place-link": true,
                  [ADW.Button.button]: true,
                  [ADW.Button.flat]: true,
                  [ADW.Button.toggled]: tabPath.derive((path) =>
                    path.equals(place.path)
                  ),
                }}
                onclick={() => handlePlaceClick(place)}
                oncontextmenu={e => openPlaceContextMenu(e, place)}
              >
                <div class="icon">
                  <DirectoryIcon />
                </div>
                <div class="label">
                  <span class={ADW.Typography.text}>
                    {place.label}
                  </span>
                </div>
              </button>
            ));
          })}
          <div class={Separator.separator} />
          {staticPlaces.derive(places => {
            return places.flatMap(place => (
              <button
                id={`static-place-${place.id}`}
                class={{
                  "place-link": true,
                  [ADW.Button.button]: true,
                  [ADW.Button.flat]: true,
                  [ADW.Button.toggled]: tabPath.derive((path) =>
                    path.equals(place.path)
                  ),
                }}
                onclick={() => handlePlaceClick(place)}
              >
                <div class="icon">
                  <DirectoryIcon />
                </div>
                <div class="label">
                  <span class={ADW.Typography.text}>
                    {place.label}
                  </span>
                </div>
              </button>
            ));
          })}
        </div>
      </div>
      <JobsView explorer={explorer} />
    </div>
  );
}

function OptionsMenu(props: { explorer: Explorer; close: () => void }) {
  const { explorer } = props;

  const hanldeShowHiddenClick = (ev: MouseEvent) => {
    if (isLmb(ev)) {
      props.explorer.directory.get().showHiddenFilesToggle();
      props.close();
    }
    ev.preventDefault();
    ev.stopPropagation();
  };

  const handleNewTabClick = (ev: MouseEvent) => {
    if (isLmb(ev)) {
      props.close();
      explorer.newTab(
        explorer.location.get().path,
      );
    }
    ev.preventDefault();
    ev.stopPropagation();
  };

  return (
    <div class={{ ["options-menu"]: true }}>
      <button
        class={{
          [ADW.Button.button]: true,
          [ADW.Button.flat]: true,
          [ADW.Button.adaptive]: true,
          "hidden": explorer.tabs.derive(t => t.length > 1),
        }}
        onmousedown={handleNewTabClick}
      >
        Split View
      </button>
      {explorer.options.explorerActions?.map(action => (
        <button
          class={{
            [ADW.Button.button]: true,
            [ADW.Button.flat]: true,
            [ADW.Button.adaptive]: true,
          }}
          onmousedown={(ev) => {
            if (isLmb(ev)) {
              props.close();
              action.run(explorer);
            }
            ev.preventDefault();
            ev.stopPropagation();
          }}
        >
          {action.label}
        </button>
      ))}
      <button
        class={{
          "show-hidden-btn": true,
          [ADW.Button.button]: true,
          [ADW.Button.flat]: true,
          [ADW.Button.adaptive]: true,
        }}
        onmousedown={hanldeShowHiddenClick}
      >
        <span>
          Show hidden files
        </span>
        <input
          type="radio"
          checked={props.explorer.directory.derive(d => d.showHidden)}
        />
      </button>
    </div>
  );
}
