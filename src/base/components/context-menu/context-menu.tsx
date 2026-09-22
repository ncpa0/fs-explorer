import { $component } from "@ncpa0cpl/vanilla-jsx";
import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer, FileAction } from "../../../explorer";
import { FStat } from "../../../filesystem-interface";
import { ADW } from "../../../utils/css";
import { isLmb } from "../../../utils/events";
import { trimTo } from "../../../utils/trim-to";

export type ContextMenuProps = {
  explorer: Explorer;
};

export function ContextMenu(props: ContextMenuProps) {
  const menu = props.explorer.contextMenu;
  const files = menu.selectedFiles.get();
  const target = menu.triggerFile.get();

  const handleMenuClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const renderButtons = () => {
    if (files.length > 0) {
      return (
        <FileMenuButtons
          explorer={props.explorer}
          files={files}
        />
      );
    }

    if (target) {
      return (
        <FileMenuButtons
          explorer={props.explorer}
          files={[target]}
        />
      );
    }

    return (
      <DirMenuButtons
        explorer={props.explorer}
      />
    );
  };

  return (
    <div
      class="context-menu"
      oncontextmenu={e => e.preventDefault()}
      onmousedown={handleMenuClick}
    >
      {renderButtons()}
    </div>
  );
}

const FileMenuButtons = $component(function FileMenuButtons(props: {
  explorer: Explorer;
  files: readonly FStat[];
}, api) {
  const { explorer } = props;
  const menu = explorer.contextMenu;

  const showCustomActions = sig(false);
  const canPaste = menu.actions.isPossibleTo.paste();

  let singleFile = menu.getTargetFile();

  const customActions = menu.getCustomActions();

  let subBtnsList: HTMLElement | undefined;
  const toggleSubMenu = contextSubMenuToggleFn(
    () => mainBtnList,
    () => subBtnsList,
  );

  api.onChange(() => {
    toggleSubMenu(showCustomActions.get());
  }, [showCustomActions]);

  const hideOpenBtn = !menu.actions.isPossibleTo.open();
  const hideNewFileBtn = !menu.actions.isPossibleTo.createFile();

  const mainBtnList = (
    <div
      class={{
        "buttons-list": true,
        "custom-actions-visible": showCustomActions,
      }}
    >
      <MenuButton
        hidden={hideOpenBtn}
        action={() => menu.actions.open()}
        title="Open"
      />
      <MenuButton
        hidden={hideNewFileBtn}
        action={() => menu.actions.createFile()}
        title="New File"
      />
      <MenuButton
        hidden={hideNewFileBtn}
        action={() => menu.actions.createDirectory()}
        title="New Directory"
      />
      {(() => {
        if (customActions.length === 0) {
          subBtnsList = undefined;
          return <span />;
        }

        const f = props.files.length > 0 ? props.files : [singleFile!];

        const handler = (action: FileAction) => () => {
          menu.close();
          action.run(f, explorer);
        };

        const topSeparator = hideOpenBtn && hideNewFileBtn
          ? <></>
          : <span class={ADW.Separator.separator} />;

        if (customActions.length <= 4) {
          return [
            topSeparator,
            customActions.map(action => (
              <MenuButton
                action={handler(action)}
                title={action.label}
              />
            )),
            <span class={ADW.Separator.separator} />,
          ].flat();
        }

        const [a1, a2, a3, ...restActions] = customActions;

        subBtnsList = (
          <div class="custom-actions buttons-list">
            <MenuButton
              action={() => {
                showCustomActions.dispatch(false);
              }}
              title="◂"
            />
            {restActions.map(action => (
              <MenuButton
                action={handler(action)}
                title={action.label}
              />
            ))}
          </div>
        ) as HTMLElement;

        return [
          topSeparator,
          <MenuButton
            action={handler(a1!)}
            title={a1!.label}
          />,
          <MenuButton
            action={handler(a2!)}
            title={a2!.label}
          />,
          <MenuButton
            action={handler(a3!)}
            title={a3!.label}
          />,
          <MenuButton
            action={() => {
              showCustomActions.dispatch(true);
            }}
            title="More Action..."
          />,
          <span class={ADW.Separator.separator} />,
          subBtnsList,
        ];
      })()}
      <MenuButton
        hidden={!canPaste}
        disabled={!canPaste}
        action={() => menu.actions.paste()}
        title={"Paste Here"}
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.pasteTo()}
        disabled={!menu.actions.isPossibleTo.pasteTo() || !singleFile}
        action={() => menu.actions.pasteTo()}
        title={`Paste To ${!!singleFile && trimTo(singleFile.name, 12)}`}
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.copy()}
        action={() => menu.actions.copy()}
        title="Copy"
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.cut()}
        action={() => menu.actions.cut()}
        title="Cut"
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.delete()}
        action={() => menu.actions.delete()}
        title="Delete"
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.rename()}
        action={() => menu.actions.rename()}
        title="Rename"
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.createShortcut()}
        action={() => menu.actions.createShortcut()}
        title={"Add shortcurt"}
      />
      <MenuButton
        hidden={!menu.actions.isPossibleTo.removeShortcut()}
        action={() => menu.actions.removeShortcut()}
        title={"Remove shortcurt"}
      />
      <MenuButton
        hidden={explorer.noPreview}
        action={() => menu.actions.showPreview()}
        title="Properties"
      />
    </div>
  );

  return mainBtnList;
});

const DirMenuButtons = $component((props: {
  explorer: Explorer;
}, api) => {
  const { explorer } = props;
  const dirStat = explorer.directory.get().stat.get();
  const menu = explorer.contextMenu;

  const showCustomActions = sig(false);
  const canPaste = menu.actions.isPossibleTo.paste();
  const customActions = menu.getCustomDirectoryActions();

  let subBtnsList: HTMLElement | undefined;
  const toggleSubMenu = contextSubMenuToggleFn(
    () => mainBtnList,
    () => subBtnsList,
  );

  api.onChange(() => {
    toggleSubMenu(showCustomActions.get());
  }, [showCustomActions]);

  const hideCreateFileBtn = !menu.actions.isPossibleTo.createFile();

  const mainBtnList = (
    <div
      class={{
        "buttons-list": true,
        "custom-actions-visible": showCustomActions,
      }}
    >
      <MenuButton
        hidden={hideCreateFileBtn}
        action={() => menu.actions.createFile()}
        title="New File"
      />
      <MenuButton
        hidden={hideCreateFileBtn}
        action={() => menu.actions.createDirectory()}
        title="New Directory"
      />
      {(() => {
        if (customActions.length === 0 || !dirStat) {
          subBtnsList = undefined;
          return <span />;
        }

        const handler = (action: FileAction) => () => {
          menu.close();
          action.run([dirStat], explorer);
        };

        const topSeparator = hideCreateFileBtn
          ? <></>
          : <span class={ADW.Separator.separator} />;
        const bottomSeparator = canPaste
          ? <span class={ADW.Separator.separator} />
          : <></>;

        if (customActions.length <= 3) {
          return [
            topSeparator,
            customActions.map(action => (
              <MenuButton
                action={handler(action)}
                title={action.label}
              />
            )),
            bottomSeparator,
          ].flat();
        }

        const [a1, ...restActions] = customActions;

        subBtnsList = (
          <div class="custom-actions buttons-list">
            <MenuButton
              action={() => {
                showCustomActions.dispatch(false);
              }}
              title="<"
            />
            {restActions.map(action => (
              <MenuButton
                action={handler(action)}
                title={action.label}
              />
            ))}
          </div>
        ) as HTMLElement;

        return [
          topSeparator,
          <MenuButton
            action={handler(a1!)}
            title={a1!.label}
          />,
          <MenuButton
            action={() => {
              showCustomActions.dispatch(true);
            }}
            title="More Action..."
          />,
          bottomSeparator,
          subBtnsList,
        ];
      })()}
      <MenuButton
        hidden={!canPaste}
        disabled={!canPaste}
        action={() => menu.actions.paste()}
        title={"Paste Here"}
      />
    </div>
  );

  return mainBtnList;
});

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
          props.action(event);
        }
      }}
      disabled={props.disabled}
    >
      {props.title}
    </button>
  );
}

export function contextSubMenuToggleFn(
  getMainMenu: () => Element,
  getSubMenu: () => HTMLElement | undefined,
) {
  let originalHeight: number;
  let originalWidth: number;
  let changedHeight: number;
  let changedWidth: number;
  let needsRevertAnimation = false;
  let lastAnimation: Animation | undefined;

  return (show: boolean) => {
    const mainBtnList = getMainMenu();
    const subBtnsList = getSubMenu();

    if (show) {
      needsRevertAnimation = true;
      setTimeout(
        () => {
          const finalHeight = subBtnsList!.getBoundingClientRect().height;
          let finalWidth = subBtnsList!.getBoundingClientRect().width;

          const initialHeight = mainBtnList!.getBoundingClientRect().height;
          const initialWidth = mainBtnList!.getBoundingClientRect().width;

          finalWidth = Math.max(finalWidth + 10, initialWidth);

          originalHeight = initialHeight;
          originalWidth = initialWidth;
          changedHeight = finalHeight;
          changedWidth = finalWidth;

          lastAnimation?.cancel();

          const animation = mainBtnList.animate([
            {
              height: `${initialHeight}px`,
              width: `${initialWidth}px`,
            },
            {
              height: `${finalHeight}px`,
              width: `${finalWidth}px`,
            },
          ], { fill: "forwards", duration: 200 });
          lastAnimation = animation;

          mainBtnList.classList.add("main-btn-no-display");

          subBtnsList!.style.position = "static";
        },
      );
    } else {
      if (needsRevertAnimation) {
        setTimeout(
          () => {
            lastAnimation?.cancel();
            subBtnsList!.style.position = "absolute";

            const animation = mainBtnList.animate([
              {
                height: `${changedHeight}px`,
                width: `${changedWidth}px`,
              },
              {
                height: `${originalHeight}px`,
                width: `${originalWidth}px`,
              },
            ], { fill: "forwards", duration: 200 });
            lastAnimation = animation;
            mainBtnList.classList.remove("main-btn-no-display");
          },
        );
      }
    }
  };
}
