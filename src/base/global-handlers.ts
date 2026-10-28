type DocumentListener<K extends keyof DocumentEventMap> = {
  id: symbol;
  key: K;
  listener: ((this: Document, ev: DocumentEventMap[K]) => any) & {
    _onced?: boolean;
  };
  options?: AddEventListenerOptions;
};

type WindowListener<K extends keyof WindowEventMap> = {
  id: symbol;
  key: K;
  listener: ((this: Window, ev: WindowEventMap[K]) => any) & {
    _onced?: boolean;
  };
  options?: AddEventListenerOptions;
};

type ElementListener<E extends Element> = {
  id: symbol;
  element: E;
  key: string;
  listener: ((this: E, ev: any) => any) & {
    _onced?: boolean;
  };
  options?: AddEventListenerOptions;
};

export class GlobalHandlers {
  private documentListeners: DocumentListener<any>[] = [];
  private windowListeners: WindowListener<any>[] = [];
  private elementListeners: ElementListener<Element>[] = [];

  private _enabled = true;

  constructor(
    private _doc = document,
    private _win = window,
  ) {}

  private addRealDocumentListener(e: DocumentListener<any>) {
    if (e.options?.once && !e.listener._onced) {
      const listener = e.listener;
      const gh = this;
      e.listener = function(this, ev) {
        gh.removeDocumentListener(e.id);
        return listener.call(this, ev);
      };
      e.listener._onced = true;
    }

    this._doc.addEventListener(e.key, e.listener, e.options);
  }

  private addRealWindowListener(e: WindowListener<any>) {
    if (e.options?.once && !e.listener._onced) {
      const listener = e.listener;
      const gh = this;
      e.listener = function(this, ev) {
        gh.removeWindowListener(e.id);
        return listener.call(this, ev);
      };
      e.listener._onced = true;
    }

    this._win.addEventListener(e.key, e.listener, e.options);
  }

  private addRealElementListener(e: ElementListener<Element>) {
    if (e.options?.once && !e.listener._onced) {
      const listener = e.listener;
      const gh = this;
      e.listener = function(this, ev) {
        gh.removeElementListener(e.id);
        return listener.call(this, ev);
      };
      e.listener._onced = true;
    }

    e.element.addEventListener(e.key, e.listener, e.options);
  }

  private stopDocumentListener(e: DocumentListener<any>) {
    this._doc.removeEventListener(e!.key, e!.listener, e.options);
  }

  private stopWindowListener(e: WindowListener<any>) {
    this._win.removeEventListener(e!.key, e!.listener, e.options);
  }

  private stopElementListener(e: ElementListener<Element>) {
    const { key, listener } = e;
    e!.element.removeEventListener(key, listener, e.options);
  }

  private removeDocumentListener(id: symbol) {
    const idx = this.documentListeners.findIndex(e => e.id === id);
    if (idx < 0) return;

    const [e] = this.documentListeners.splice(idx, 1);
    this._doc.removeEventListener(e!.key, e!.listener, e!.options);
  }

  private removeWindowListener(id: symbol) {
    const idx = this.windowListeners.findIndex(e => e.id === id);
    if (idx < 0) return;

    const [e] = this.windowListeners.splice(idx, 1);
    this._win.removeEventListener(e!.key, e!.listener, e!.options);
  }

  private removeElementListener(id: symbol) {
    const idx = this.elementListeners.findIndex(e => e.id === id);
    if (idx < 0) return;

    const [e] = this.elementListeners.splice(idx, 1);
    const { key, listener } = e!;
    e!.element.removeEventListener(key, listener, e!.options);
  }

  enable() {
    if (this._enabled) return;

    for (const e of this.windowListeners) {
      this.addRealWindowListener(e);
    }
    for (const e of this.documentListeners) {
      this.addRealDocumentListener(e);
    }
    for (const e of this.elementListeners) {
      this.addRealElementListener(e);
    }

    this._enabled = true;
  }

  disable() {
    if (!this._enabled) return;

    for (const e of this.windowListeners) {
      this.stopWindowListener(e);
    }
    for (const e of this.documentListeners) {
      this.stopDocumentListener(e);
    }
    for (const e of this.elementListeners) {
      this.stopElementListener(e);
    }

    this._enabled = false;
  }

  onDocument<K extends keyof DocumentEventMap>(
    key: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => any,
    options?: AddEventListenerOptions,
  ): () => void {
    const id = Symbol();

    if (options?.signal) {
      if (options.signal.aborted) return () => {};

      options.signal.addEventListener("abort", () => {
        this.removeDocumentListener(id);
      }, { once: true });
    }

    const entry: DocumentListener<K> = {
      listener,
      options,
      key,
      id,
    };

    this.documentListeners.push(entry);

    if (this._enabled) {
      this.addRealDocumentListener(entry);
    }

    return () => {
      this.removeDocumentListener(id);
    };
  }

  onWindow<K extends keyof WindowEventMap>(
    key: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: AddEventListenerOptions,
  ): () => void {
    const id = Symbol();

    if (options?.signal) {
      if (options.signal.aborted) return () => {};

      options.signal.addEventListener("abort", () => {
        this.removeWindowListener(id);
      }, { once: true });
    }

    const entry: WindowListener<K> = {
      listener,
      options,
      key,
      id,
    };

    this.windowListeners.push(entry);

    if (this._enabled) {
      this.addRealWindowListener(entry);
    }

    return () => {
      this.removeWindowListener(id);
    };
  }

  onElement<E extends Element>(
    elem: E,
    key: Parameters<E["addEventListener"]>[0],
    listener: Parameters<E["addEventListener"]>[1],
    options?: AddEventListenerOptions,
  ): () => void {
    const id = Symbol();

    if (options?.signal) {
      if (options.signal.aborted) return () => {};

      options.signal.addEventListener("abort", () => {
        this.removeElementListener(id);
      }, { once: true });
    }

    const entry: ElementListener<Element> = {
      element: elem,
      id,
      key,
      listener: listener as any,
      options,
    };

    this.elementListeners.push(entry);

    if (this._enabled) {
      this.addRealElementListener(entry);
    }

    return () => {
      this.removeElementListener(id);
    };
  }
}
