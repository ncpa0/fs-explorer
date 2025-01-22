import { Explorer } from "../../../explorer";
import { asCssValue } from "../../../utils/as-px";

export function Overlay(props: { explorer: Explorer }) {
  const { overlay } = props.explorer;
  const visible = overlay.hasContent();
  const dimBg = overlay.dimBg();

  const handleOverlayClick = (ev: MouseEvent) => {
    if (!overlay.shouldCloseOnBgClick()) {
      return;
    }

    // check if the click was inside the .overlay-contents
    if (
      ev.target && ev.target instanceof Element
      && ev.target.closest(".overlay-contents")
    ) {
      return;
    }

    overlay.close();
  };

  return (
    <div
      class={{
        "explorer-overlay": true,
        "dimmed-background": dimBg,
        visible,
      }}
      onclick={handleOverlayClick}
    >
      <div
        class="overlay-contents"
        style={overlay.Position().derive(pos => {
          if (pos) {
            return {
              position: "absolute",
              top: asCssValue(pos.top),
              left: asCssValue(pos.left),
              right: asCssValue(pos.right),
              bottom: asCssValue(pos.bottom),
            };
          }
          return {};
        })}
      >
        {overlay.Output()}
      </div>
    </div>
  );
}
