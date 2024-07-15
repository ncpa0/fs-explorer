import { Explorer, Place } from "../../..";
import DirectoryIcon from "../../../assets/main-theme/icons/directory.svg";
import { ACSS } from "../../../utils/css";

export type LeftPaneProps = {
  explorer: Explorer;
};

export function LeftPane(props: LeftPaneProps) {
  const handlePlaceClick = (place: Place) => {
    props.explorer.open(place.path);
  };

  return (
    <div class={["left-pane", ACSS.Box.box, ACSS.Box.bg3]}>
      <div class="places-label">
        <span class={ACSS.Typography.label}>Places</span>
      </div>
      <div class={["left-pane-places"]}>
        {props.explorer.places.derive(places => {
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
                <span class={ACSS.Typography.text}>
                  {place.label}
                </span>
              </div>
            </div>
          ));
        })}
        <div class="dcontents seps">
          <div class="separator" />
          <div class="separator" />
        </div>
        {props.explorer.staticPlaces.derive(places => {
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
                <span class={ACSS.Typography.text}>
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
