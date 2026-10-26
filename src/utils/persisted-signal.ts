import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { StorageInterface } from "../explorer";

/**
 * @param validate - When provided, a stored value that fails it is discarded
 * in favor of `initialVal` (and rewritten to the store on the next change).
 */
export function localSig<T>(
  store: StorageInterface,
  key: string,
  initialVal: T,
  validate?: (value: unknown) => boolean,
) {
  let storedInitial = store.getItem(key);
  if (storedInitial != null) {
    try {
      storedInitial = JSON.parse(storedInitial);
    } catch {
      storedInitial = null;
    }
  }
  const accepted = storedInitial != null
    && (!validate || validate(storedInitial));
  const s = sig(accepted ? (storedInitial as T) : initialVal);

  s.add((v) => {
    try {
      const str = JSON.stringify(v);
      store.setItem(key, str);
    } catch {}
  });

  return s;
}
