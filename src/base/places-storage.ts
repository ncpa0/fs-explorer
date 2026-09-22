import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Place, StorageInterface } from "../explorer";
import { Stored } from "../utils/stored";

export class PlacesStorage {
  private readonly storage;
  private readonly places = sig<ReadonlyArray<Place>>([]);

  public onChange = (places: readonly Place[]) => {};

  constructor(
    storage: StorageInterface,
    defaultPlaces?: readonly Place[],
    protected readonly persistent = true,
  ) {
    this.storage = new Stored(storage, "fsexplorer_places", [] as Place[]);

    const persistedPlaces = persistent ? this.storage.get() : [];

    if (defaultPlaces) {
      for (const place of defaultPlaces) {
        this.addPlace(place);
      }
    }

    for (const place of persistedPlaces) {
      this.addPlace(place);
    }
  }

  findByPath(path: string) {
    return this.places.get().find(p => p.path === path);
  }

  findByID(id: string) {
    return this.places.get().find(p => p.id === id);
  }

  addPlace(place: Place) {
    if (this.findByPath(place.path) || this.findByID(place.id)) {
      return;
    }

    const current = this.places.get();
    const newList = current.concat(place);

    if (this.persistent) {
      this.storage.set(newList);
    }
    this.places.dispatch(newList);
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
            return { ...p, label: newName };
          }
          return p;
        });
        return newPlaces;
      });
    }
    this.places.dispatch(current => {
      const newPlaces = current.map(p => {
        if (p.id === placeID) {
          return { ...p, label: newName };
        }
        return p;
      });
      return newPlaces;
    });
    this.onChange(this.places.get());
  }

  clear() {
    if (this.persistent) {
      this.storage.set([]);
    }
    this.places.dispatch([]);
    this.onChange(this.places.get());
  }

  list() {
    return this.places.readonly();
  }
}
