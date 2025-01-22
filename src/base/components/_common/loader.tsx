import { ADW } from "../../../utils/css";

export function LoadingIndicator() {
  return (
    <div
      class={{
        "loader-indicator": true,
        visible: true,
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
