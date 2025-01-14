import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Place } from "../explorer";
import { Stored } from "../utils/stored";

export class PlacesStorage {
  private readonly storage = new Stored("fsexplorer_places", [] as Place[]);
  private readonly places = sig<ReadonlyArray<Place>>([]);

  public onChange = (places: readonly Place[]) => {};

  constructor(
    defaultPlaces?: readonly Place[],
    protected readonly persistent = true,
  ) {
    const persistedPlaces = persistent ? this.storage.get() : [];
    if (defaultPlaces) {
      this.places.dispatch(defaultPlaces.slice().concat(persistedPlaces));
    } else {
      this.places.dispatch(persistedPlaces);
    }
  }

  findByPath(path: string) {
    return this.places.get().find(p => p.path === path);
  }

  addPlace(place: Place) {
    if (this.findByPath(place.path)) {
      return;
    }

    if (this.persistent) {
      this.storage.set(current => {
        const newPlaces = current.concat(place);
        return newPlaces;
      });
    }
    this.places.dispatch(current => {
      const newPlaces = current.concat(place);
      return newPlaces;
    });
    this.onChange(this.places.get());
  }

  removePlace(placeID: string) {
    if (this.persistent) {
      this.storage.set(current => {
        const newPlaces = current.filter(p => p.id !== placeID);
        return newPlaces;
      });
    }
    this.places.dispatch(current => {
      const newPlaces = current.filter(p => p.id !== placeID);
      return newPlaces;
    });
    this.onChange(this.places.get());
  }

  renamePlace(placeID: string, newName: string) {
    if (this.persistent) {
      this.storage.set(current => {
        const newPlaces = current.map(p => {
          if (p.id === placeID) {
            return { ...p, name: newName };
          }
          return p;
        });
        return newPlaces;
      });
    }
    this.places.dispatch(current => {
      const newPlaces = current.map(p => {
        if (p.id === placeID) {
          return { ...p, name: newName };
        }
        return p;
      });
      return newPlaces;
    });
    this.onChange(this.places.get());
  }

  list() {
    return this.places.readonly();
  }
}
