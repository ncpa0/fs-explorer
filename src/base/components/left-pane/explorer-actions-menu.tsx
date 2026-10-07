import {
  MaybeReadonlySignal,
  sig,
  Signal,
} from "@ncpa0cpl/vanilla-jsx/signals";
import { Separator } from "adwavecss";
import MoreIcon from "../../../assets/main-theme/icons/more.svg";
import { Explorer } from "../../../explorer";
import { ADW } from "../../../utils/css";
import { isLmb } from "../../../utils/events";
import { getRelativePosition } from "../../../utils/get-relative-position";
import { SortMode } from "../dir-view/sort-files";

export function DirectoryOptionsButton(props: { explorer: Explorer }) {
  const { explorer } = props;
  const { overlay } = explorer;

  const sortSubmenuVisible = sig(false);

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
        onClose() {
          sortSubmenuVisible.dispatch(false);
        },
      },
      <OptionsMenu
        explorer={explorer}
        close={() => overlay.close()}
        sortSubmenuVisible={sortSubmenuVisible}
      />,
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

function OptionsMenu(props: {
  sortSubmenuVisible: Signal<boolean>;
  explorer: Explorer;
  close: () => void;
}) {
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
      <SortSubmenuBtn
        explorer={explorer}
        submenuVisible={props.sortSubmenuVisible}
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
      <span
        class={{
          "toggle-indicator": true,
          active: props.active,
        }}
      />
    </button>
  );
}

function SortSubmenuBtn(props: {
  explorer: Explorer;
  submenuVisible: Signal<boolean>;
}) {
  const { explorer, submenuVisible } = props;

  const toggleSubmenu = (
    ev: MouseEvent & { target: HTMLButtonElement },
  ) => {
    if (submenuVisible.get()) {
      submenuVisible.dispatch(false);
      return;
    }

    const btnRect = ev.target.getBoundingClientRect();
    const optMenu = ev.target.closest(".options-menu");
    if (optMenu == null) return;
    const menuRect = optMenu.getBoundingClientRect();

    const leftPos = menuRect.width;
    const topPos = btnRect.top - menuRect.top;

    submenu.style.top = topPos + "px";
    submenu.style.left = leftPos + "px";

    submenuVisible.dispatch(true);
  };

  const isNameSort = explorer.currentTab.derive(t =>
    t.directory.sorting.derive(({ mode }) => mode === SortMode.Alpha)
  );
  const isSizeSort = explorer.currentTab.derive(t =>
    t.directory.sorting.derive(({ mode }) => mode === SortMode.Size)
  );
  const isDateSort = explorer.currentTab.derive(t =>
    t.directory.sorting.derive(({ mode }) => mode === SortMode.Date)
  );
  const isTypeSort = explorer.currentTab.derive(t =>
    t.directory.sorting.derive(({ mode }) => mode === SortMode.Type)
  );

  const isDescending = explorer.currentTab.derive(t =>
    t.directory.sorting.derive(({ reverse }) => reverse)
  );

  const sortBy = (mode: SortMode) => () => {
    explorer.currentTab.get().directory.sorting.dispatch(({ reverse }) => ({
      mode,
      reverse,
    }));
  };

  const setReverse = (reverse: boolean) => () => {
    explorer.currentTab.get().directory.sorting.dispatch(({ mode }) => ({
      mode,
      reverse,
    }));
  };

  const submenu = (
    <div class={{ "sort-submenu": true, "visible": submenuVisible }}>
      <ToggleBtn
        label="Name"
        onClick={sortBy(SortMode.Alpha)}
        active={isNameSort}
        class="sort-select-btn"
      />
      <ToggleBtn
        label="Date"
        onClick={sortBy(SortMode.Date)}
        active={isDateSort}
        class="sort-select-btn"
      />
      <ToggleBtn
        label="Type"
        onClick={sortBy(SortMode.Type)}
        active={isTypeSort}
        class="sort-select-btn"
      />
      <ToggleBtn
        label="Size"
        onClick={sortBy(SortMode.Size)}
        active={isSizeSort}
        class="sort-select-btn"
      />

      <span class={Separator.separator} />

      <ToggleBtn
        label="Ascending"
        onClick={setReverse(false)}
        active={sig.not(isDescending)}
        class="sort-direction-select-btn"
      />
      <ToggleBtn
        label="Descending"
        onClick={setReverse(true)}
        active={isDescending}
        class="sort-direction-select-btn"
      />
    </div>
  ) as HTMLDivElement;

  return (
    <div>
      <button
        class={{
          [ADW.Button.button]: true,
          [ADW.Button.flat]: true,
          [ADW.Button.adaptive]: true,
          "sort-submenu-btn": true,
        }}
        onmousedown={toggleSubmenu}
      >
        <span>
          Sort by
        </span>
        <span>
          {"▸"}
        </span>
      </button>
      {submenu}
    </div>
  );
}
