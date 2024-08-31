import { ReadonlySignal } from "@ncpa0cpl/vanilla-jsx/signals";
import { ADW } from "../../../utils/css";

export function LoadingIndicator(
  props: { visible: boolean | ReadonlySignal<boolean> },
) {
  const { visible } = props;
  return (
    <div
      class={{
        "loader-indicator": true,
        visible,
      }}
    >
      <div
        class={ADW.Spinner.spinner}
      >
        <div
          class={ADW.Spinner.innerCircle}
        />
      </div>
    </div>
  );
}
