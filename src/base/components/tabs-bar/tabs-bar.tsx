import { ReadonlySignal, sig } from "@ncpa0cpl/vanilla-jsx/signals";
import throttle from "lodash.throttle";
import CloseIcon from "../../../assets/main-theme/icons/close.svg";
import { Explorer } from "../../../explorer";

export function TabsBar(props: {
  explorer: Explorer;
  hidden: ReadonlySignal<boolean>;
}) {
  const { explorer } = props;

  const handleScroll = throttle(
    (e: WheelEvent) => {
      if (e.deltaX !== 0) {
        return;
      }

      if (e.deltaY !== 0) {
        e.preventDefault();
        try {
          barElem.scrollBy({ left: -e.deltaY, behavior: "smooth" });
        } catch {}
      }
    },
    64,
    { leading: true, trailing: true },
  );

  const barElem = (
    <div
      class={{
        "tabs-bar": true,
        "hidden": props.hidden,
      }}
      // @ts-expect-error
      onmousewheel={handleScroll}
    >
      {explorer.tabGroups.$map(g => {
        const handleTabBtnPress = () => {
          explorer.focusTabGroup(g.id);
        };

        const closeTabGroup = () => {
          explorer.closeTabGroup(g.id);
        };

        return (
          <button
            class={{
              btn: true,
              "tab-button": true,
              active: sig.eq(explorer.activeTabGroup, g.id),
            }}
            onmousedown={handleTabBtnPress}
            onauxclick={closeTabGroup}
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
          </button>
        );
      })}
    </div>
  );

  return barElem;
}
