import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import DirectoryIcon from "../../../assets/main-theme/icons/directory.svg";
import MoreIcon from "../../../assets/main-theme/icons/more.svg";
import { Explorer, Place } from "../../../explorer";
import { ADW } from "../../../utils/css";

export type LeftPaneProps = {
  explorer: Explorer;
};

export function LeftPane(props: LeftPaneProps) {
  const { places, staticPlaces } = props.explorer;

  const handlePlaceClick = (place: Place) => {
    props.explorer.open(place.path);
  };

  return (
    <div class={["left-pane", ADW.Box.box, ADW.Box.bg3]}>
      <div class={"pane-header"}>
        <span class={[ADW.Typography.text, "header-title"]}>Places</span>
        <button
          class={[
            ADW.Button.button,
            ADW.Button.flat,
            ADW.Button.square,
            ADW.Button.adaptive,
          ]}
        >
          <MoreIcon />
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
