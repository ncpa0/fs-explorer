import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import throttle from "lodash.throttle";
import CloseIcon from "../../../assets/main-theme/icons/close.svg";
import { Explorer } from "../../../explorer";

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
            class={{
              btn: true,
              "tab-button": true,
              active: selected,
            }}
            onmousedown={handleTabBtnPress}
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
      })}
    </div>
  );

  return barElem;
}
