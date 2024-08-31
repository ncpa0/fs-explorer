import { sig, Signal } from "@ncpa0cpl/vanilla-jsx/signals";
import DirectoryIcon from "../../../assets/main-theme/icons/directory.svg";
import MoreIcon from "../../../assets/main-theme/icons/more.svg";
import { Explorer, Place } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { isLmb } from "../../../utils/events";

export type LeftPaneProps = {
  explorer: Explorer;
};

export function LeftPane(props: LeftPaneProps) {
  const { explorer } = props;
  const { places, staticPlaces } = explorer;
  const showOptions = sig(false);

  const handlePlaceClick = (place: Place) => {
    explorer.open(place.path);
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
      <div class={"pane-header"}>
        <span class={[ADW.Typography.text, "header-title"]}>Places</span>
        <button
          class={{
            "options-btn": true,
            [ADW.Button.button]: true,
            [ADW.Button.flat]: true,
            [ADW.Button.square]: true,
            [ADW.Button.adaptive]: true,
            "active": showOptions,
          }}
          onmousedown={() => showOptions.dispatch(v => !v)}
        >
          <MoreIcon />
          <OptionsMenu explorer={explorer} show={showOptions} />
        </button>
      </div>
      <div class={["left-pane-places"]}>
        {places.derive(places => {
          return places.flatMap(place => (
            <div
              id={`place-${place.id}`}
              class="dcontents place-link"
              onmousedown={() => handlePlaceClick(place)}
            >
              <div class="icon">
                <DirectoryIcon />
              </div>
              <div class="label">
                <span class={ADW.Typography.text}>
                  {place.label}
                </span>
              </div>
            </div>
          ));
        })}
        <div
          class={{
            ["dcontents seps"]: true,
            hidden: sig.derive(
              places,
              staticPlaces,
              (places, staticPlaces) =>
                places.length === 0 || staticPlaces.length === 0,
            ),
          }}
        >
          <div class="separator" />
          <div class="separator" />
        </div>
        {staticPlaces.derive(places => {
          return places.flatMap(place => (
            <div
              id={`static-place-${place.id}`}
              class="dcontents place-link "
              onmousedown={() => handlePlaceClick(place)}
            >
              <div class="icon">
                <DirectoryIcon />
              </div>
              <div class="label">
                <span class={ADW.Typography.text}>
                  {place.label}
                </span>
              </div>
            </div>
          ));
        })}
      </div>
    </div>
  );
}

function OptionsMenu(props: { explorer: Explorer; show: Signal<boolean> }) {
  const { explorer } = props;

  const hanldeShowHiddenClick = (ev: MouseEvent) => {
    if (isLmb(ev)) {
      props.explorer.directory.showHiddenFilesToggle();
      props.show.dispatch(false);
    }
    ev.preventDefault();
    ev.stopPropagation();
  };

  return (
    <div class={{ ["options-menu"]: true, show: props.show }}>
      {explorer.options.explorerActions?.map(action => (
        <button
          class={{
            [ADW.Button.button]: true,
            [ADW.Button.flat]: true,
            [ADW.Button.adaptive]: true,
          }}
          onmousedown={(ev) => {
            if (isLmb(ev)) {
              props.show.dispatch(false);
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
          checked={props.explorer.directory.showHidden}
        />
      </button>
    </div>
  );
}
