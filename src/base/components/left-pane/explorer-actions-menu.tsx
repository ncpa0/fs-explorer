import { MaybeReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import MoreIcon from "../../../assets/main-theme/icons/more.svg";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { isLmb } from "../../../utils/events";
import { getRelativePosition } from "../../../utils/get-relative-position";

export function DirectoryOptionsButton(props: { explorer: Explorer }) {
  const { explorer } = props;
  const { overlay } = explorer;

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

  const optionsBtn = (
    <button
      class={{
        "dir-options-btn": true,
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

  return optionsBtn;
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

  const handleGalleryViewClick = (ev: MouseEvent) => {
    if (isLmb(ev)) {
      props.explorer.directory.get().galleryView.dispatch(v => !v);
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
          "split-view-btn": true,
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
      <ToggleBtn
        label="Gallery view"
        onClick={handleGalleryViewClick}
        active={props.explorer.directory.derive(d => d.galleryView.get())}
        class="gallery-view-btn"
      />
      <ToggleBtn
        label="Show hidden files"
        onClick={hanldeShowHiddenClick}
        active={props.explorer.directory.derive(d => d.showHidden)}
        class="show-hidden-btn"
      />
    </div>
  );
}

function ToggleBtn(props: {
  onClick: (e: MouseEvent) => void;
  active: MaybeReadonlySignal<boolean>;
  label: string;
  class: string;
}) {
  return (
    <button
      class={{
        "toggle-btn": true,
        [ADW.Button.button]: true,
        [ADW.Button.flat]: true,
        [ADW.Button.adaptive]: true,
        [props.class]: true,
      }}
      onmousedown={props.onClick}
    >
      <span>
        {props.label}
      </span>
      <input
        type="radio"
        checked={props.active}
      />
    </button>
  );
}
