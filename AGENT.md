# AGENT.md — fs-explorer

`@ncpa0cpl/fs-explorer`: a self-contained, framework-light **tabbed file-explorer UI widget** (vanilla DOM via `@ncpa0cpl/vanilla-jsx` + adwavecss/adwaveui). It knows nothing about Electron or Node fs — all real filesystem access is injected through the `Filesystem` interface. The sibling app `electron-xplorer` is the primary consumer.

## Commands

```sh
yarn build       # REQUIRED after any src change — emits dist/{esm,cjs,types,bundle} via scripts/build.mjs (esbuild)
yarn test:tsc    # typecheck
yarn test:fmt    # dprint check        yarn fix:fmt → dprint fmt
yarn test:lint   # oxlint              yarn fix:lint → oxlint --fix
```

The library is consumed through its built `dist/` (package `exports`: `.` → `dist/esm/index.mjs` + `dist/types/index.d.ts`).

## Source map

```
src/
  index.ts                 public exports (Explorer, types, interfaces)
  explorer.ts              Explorer class — the root controller/options type
  filesystem-interface.ts  Filesystem + FStat — THE contract with the host app
  interfaces/              action-error, file-action
  styles-component.tsx     injects styles.css; styles.css is the theme root
  base/                    controllers (one per concern):
    tab-controller.ts        tabs: history + DirViewController per tab
    dir-view-controller.ts   current-dir state: listing, selection, hidden toggle, sort
    fs-controller.ts         filesystem ops used by built-in actions (copy/move/paste,
                             remove → Filesystem.remove, mkdir, touch, rename)
    history.ts               per-tab navigation history (back/forward/backPush)
    clipboard-controller.ts  internal file clipboard (copy/cut/paste)
    context-menu-controller.tsx  built-in menu entries + custom action merging,
                                 nameValidator for rename prompts
    prompt-controller.tsx    modal prompts (ask/input) used for deletes/renames
    overlay-controller.ts    full-window overlay (jobs, bulk rename, app overlays)
    jobs-controller.ts       progress jobs (copy/move feedback)
    preview-pane-controller.ts  right-hand preview pane state
    places-storage.ts        left-pane places, persisted via StorageInterface
    drag-controller.ts       in-window emulated drag & drop (MOVE semantics)
    dir-cache.ts             per-explorer directory data cache
    race-queue.ts            async op ordering
  base/components/         DOM components (vanilla-jsx), one folder per UI region:
    window/ (tabs + shell), left-pane/, location-bar/, dir-view/ (list & gallery
    virtualized views, sort), context-menu/, preview-pane/, prompt/, overlay/,
    statusbar/, jobs/, bulk-rename/, _common/
  utils/                   pure helpers — path.ts is the important one (see below),
                           immediate.ts (Immediate promise combinator), collator,
                           formatters, get-file-icon (assets/main-theme/icons/*.svg),
                           chunks, scheduler, stored, memo decorator
```

## Key architecture points

- **`Filesystem` interface** (`filesystem-interface.ts`) is the whole IO contract: `readdir`, `readdirStat`, `stat`, `copy`, `move`, `remove`, `mkdir`, `touch`, `exists`, `dirExists`, `onChange/offChange`, optional `dirSize` and `thumbnail`. The lib never touches disk itself.
  - `FStat.trash?: { originalPath, deletionTime }` marks items inside the host's trash (used by the app's "Restore" action).
- **`Path`** (`utils/path.ts`) is a parsed-path value type used everywhere (basename, dir, join, equals — segment-wise comparison). It supports a narrow `scheme://` root form (e.g. `trash:///`): `dir()` of the scheme root is itself, schemes propagate through join/dir/equals. Scheme-awareness rules (enforced in tests, don't regress): `isInside` normalizes both sides and returns false across different schemes or across absolute/relative (`/foo` is NOT inside `trash:///`); `join` adopts the scheme of a scheme-rooted argument (`Path.from("/a").join("trash:///x")` stays scheme-rooted, never silently degrades to a plain path); plain paths are unaffected when touching it.
- **`Explorer`** (`explorer.ts`) wires controllers + renders `ExplorerWindow`; options (`ExplorerOptions`) are the extension points: `openAction`, `actions` (custom `FileAction`s in the context menu), `actionFilters`, `explorerActions` (toolbar menu), `places`/`staticPlaces`, `hideLeftPane`, `plainList`, `noPreview`, `initDir`, `fileDropHandler`, `nativeDragOut`, `storage`.
  - Signals (`sig`, `sig.derive`, `observe`) drive all state; note `location`/`directory`/`history` derive from the active tab.
- **Delete semantics**: built-in delete (context menu + Delete key) calls `Filesystem.remove(path)` — the LIB doesn't decide trash vs permanent; the host's implementation does (the app maps `remove` → trash). The lib never calls `remove()` during overwrite flows (it prompts, then expects copy/move to overwrite).
- **Built-in actions** (`ActionType`: newfile/newdir/open/copy/cut/paste/delete/rename/createShortcut) are gated by `actionFilters` and merged with custom `actions` in the context menu; custom action visibility is controlled by the action's own `match(files, { isCurrentDir })`.
- **Watching**: the lib registers ONE global `(dirPath?: string) => void` callback; the host is expected to fire it with the exact directory path string previously browsed (equality is via `Path.equals`, segment-wise).
- **Drag & drop**: in-window drags are emulated (always MOVE) and can be handed off to the OS via `nativeDragOut`; external drops reach `fileDropHandler`.
- **Places** (left pane): user-managed list persisted through `StorageInterface` (defaults to `localStorage`), plus immutable `staticPlaces`.

## Conventions & gotchas

- Formatting: dprint (`yarn fix:fmt`); linting: oxlint. Match the verbose doc-comment style of existing files.
- Components are plain functions returning `createElement` hyperscript trees (`.tsx` with the JSX factory configured, or `.ts` hyperscript); styles colocated per component folder, imported as side-effect CSS.
- Change requests that alter the `Filesystem` interface or `Path` semantics must be checked against the app side too (`electron-xplorer/src/renderer/fs-adapter.ts`) — and the app must be re-synced via `yarn build` here.
- The `dist/` output is committed-checked by consumers via the exports map; don't hand-edit `dist/`.
- README.md documents the public API from the host-app perspective (`Explorer` options, `Filesystem`, examples).
