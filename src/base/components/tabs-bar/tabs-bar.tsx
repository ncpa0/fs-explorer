import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import throttle from "lodash.throttle";
import CloseIcon from "../../../assets/main-theme/icons/close.svg";
import { Explorer } from "../../../explorer";
import { useFileDrop } from "../../../utils/use-file-drop";
import { TabGroup } from "../../tab-group";

export function TabsBar(props: {
  explorer: Explorer;
  hidden: ReadonlySignal<boolean>;
}) {
  const { explorer } = props;

  const virtualScroll = throttle(
    (amount: number) => {
      barElem.scrollBy({ left: amount, behavior: "smooth" });
    },
    64,
    { leading: true, trailing: true },
  );

  const handleScroll = (e: WheelEvent) => {
    if (e.deltaX !== 0) {
      return;
    }

    if (e.deltaY !== 0) {
      e.preventDefault();
      virtualScroll(-e.deltaY);
    }
  };

  const barElem = (
    <div
      role="tablist"
      class={{
        "tabs-bar": true,
        "hidden": props.hidden,
      }}
      onwheel={handleScroll}
    >
      {explorer.tabGroups.$map(g => {
        return <TabButton explorer={explorer} group={g} />;
      })}
    </div>
  );

  return barElem;
}

function TabButton(props: {
  group: TabGroup;
  explorer: Explorer;
}) {
  const { explorer, group: g } = props;

  const { onmouseup, onmouseenter, onmouseleave, targetClassName } =
    useFileDrop(
      explorer,
      () => g.activeTab.get().directory.stat.get()?.path,
    );

  const handleTabBtnPress = () => {
    explorer.focusTabGroup(g.id);
  };

  const closeTabGroup = () => {
    explorer.closeTabGroup(g.id);
  };

  const selected = sig.eq(explorer.activeTabGroup, g.id);

  return (
    <div
      role="tab"
      aria-selected={selected}
      class={sig.derive(
        selected,
        targetClassName,
        (selected, targetClassName) => ({
          btn: true,
          "tab-button": true,
          [targetClassName]: true,
          active: selected,
        }),
      )}
      onmousedown={handleTabBtnPress}
      onmouseup={onmouseup}
      onmouseenter={onmouseenter}
      onmouseleave={onmouseleave}
      onauxclick={e => {
        if (e.button === 1) {
          closeTabGroup();
        }
      }}
      title={g.activeTab.derive(t => t.fullLocationPreview)}
    >
      <span>
        {g.activeTab.derive(t => t.locationPreview)}
      </span>
      <button
        class="close-tab-btn btn-with-icon"
        onmousedown={e => {
          closeTabGroup();
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
