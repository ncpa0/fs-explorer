import { PropsForElement } from "@ncpa0cpl/vanilla-jsx/dist/types/jsx-namespace/prop-types/shared/props-for-element";
import type {
  AdwSelector,
  AdwSelectorEvents,
  AdwSelectorOption,
  AdwSwitch,
  AdwSwitchChangeEvent,
} from "adwaveui";
import type { AttributesOf, CustomElement, EventNamesOf } from "wc_toolkit";

export {};

type WithSignals<T> = {
  [K in keyof T]: T[K] | JSX.Signal<T[K]>;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "adw-switch": HTMLProps<Partial<Omit<AdwSwitch, "children">>>;
      "adw-selector": HTMLProps<Partial<Omit<AdwSelector, "children">>>;
      "adw-option": HTMLProps<Partial<Omit<AdwSelectorOption, "children">>>;
    }
  }
}
