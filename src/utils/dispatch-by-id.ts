export function byID<ID, T extends { id: ID }>(
  id: ID,
  update: (entry: T) => T,
): (state: T[]) => T[] {
  return (state: T[]) => {
    const idx = state.findIndex(entry => entry.id === id);
    if (idx === -1) {
      return state;
    }
    const newState = [...state];
    newState[idx] = update(state[idx]!);
    return newState;
  };
}
