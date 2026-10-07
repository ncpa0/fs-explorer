import { Separator } from "adwavecss";
import DirectoryIcon from "../../../assets/main-theme/icons/directory.svg";
import { Explorer, Place } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { JobsView } from "../jobs/jobs-view";
import { DirectoryOptionsButton } from "./explorer-actions-menu";
import { PlaceContextMenu } from "./place-context-menu";

export type LeftPaneProps = {
  explorer: Explorer;
};

export function LeftPane(props: LeftPaneProps) {
  const { explorer } = props;
  const { staticPlaces } = explorer;
  const places = explorer.places.list();
  const tabPath = explorer.location.derive(l => l.signal);

  const handlePlaceClick = (place: Place) => {
    explorer.open(place.path);
  };

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
          <DirectoryOptionsButton explorer={explorer} />
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
