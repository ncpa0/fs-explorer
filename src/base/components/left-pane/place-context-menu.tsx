import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer, Place } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { isLmb } from "../../../utils/events";

export function PlaceContextMenu(props: {
  explorer: Explorer;
  place: Place;
}) {
  const openPlace = () => {
    props.explorer.overlay.close();
    props.explorer.open(props.place.path);
  };

  const openPlaceInSplitView = () => {
    props.explorer.overlay.close();
    props.explorer.newTab(props.place.path);
  };

  const removePlace = () => {
    props.explorer.overlay.close();
    props.explorer.places.removePlace(props.place.id);
  };

  const renamePlace = async () => {
    props.explorer.overlay.close();

    const result = await props.explorer.prompt.input({
      title: "Shortcut name",
      initialValue: props.place.label,
      validate: v =>
        v.length > 0 ? "ok" : { msg: "Shortcut name cannot be empty" },
      message: "Enter new shortcut name",
    });

    if (result) {
      props.explorer.places.renamePlace(props.place.id, result);
    }
  };

  return (
    <div
      class={{
        "buttons-list": true,
        "left-pane-context-menu": true,
      }}
    >
      <MenuButton title="Open" action={openPlace} />
      <MenuButton title="Open in split view" action={openPlaceInSplitView} />
      <MenuButton title="Remove shortcut" action={removePlace} />
      <MenuButton title="Rename" action={renamePlace} />
    </div>
  );
}

function MenuButton(
  props: {
    action(ev: MouseEvent): void;
    hidden?: boolean | ReadonlySignal<boolean>;
    disabled?: boolean | ReadonlySignal<boolean>;
    title: string | ReadonlySignal<string>;
  },
) {
  return (
    <button
      class={{
        "context-menu-btn": true,
        [ADW.Button.button]: true,
        [ADW.Button.flat]: true,
        [ADW.Button.adaptive]: true,
        [ADW.Button.disabled]: props.disabled,
        hidden: props.hidden,
      }}
      onmousedown={(event) => {
        if (isLmb(event)) {
          event.preventDefault();
          event.stopPropagation();
          props.action(event);
        }
      }}
      disabled={props.disabled}
    >
      {props.title}
    </button>
  );
}
