import { Case, Switch } from "@ncpa0cpl/vanilla-jsx";
import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import {
  Box,
  Button,
  Input,
  NavSidebar,
  ScrollView,
  Typography,
} from "adwavecss";
import CloseIcon from "../../../assets/main-theme/icons/close.svg";
import {
  Explorer,
  InputPreference,
  PreferenceContext,
  SelectionPreference,
  SwitchPreference,
} from "../../../explorer";
import { Path } from "../../../utils/path";
import { GALLERY_THUMBNAIL_SIZES } from "../dir-view/gallery-file-list";

export enum PreferencePages {
  Appearance,
  Behavior,
  Advanced,
}

const GALLERY_SIZE_LABELS = {
  6: "Small",
  8: "Medium",
  12: "Large",
  16: "Extra Large",
} as const;

export function PreferencesWindow(props: {
  explorer: Explorer;
}) {
  const page = sig(PreferencePages.Appearance);

  const handlePageBtnPress = (p: PreferencePages) => () => {
    page.dispatch(p);
  };

  return (
    <div class={[Box.box, "preferences-settings"]}>
      <div class={NavSidebar.navSidebar}>
        <div class="nav-header">
          <h1 class={Typography.header_sm}>
            Preferences
          </h1>
        </div>
        <button
          class={{
            [NavSidebar.button]: true,
            [NavSidebar.active]: sig.eq(page, PreferencePages.Appearance),
          }}
          onmousedown={handlePageBtnPress(PreferencePages.Appearance)}
        >
          Appearance
        </button>
        <button
          class={{
            [NavSidebar.button]: true,
            [NavSidebar.active]: sig.eq(page, PreferencePages.Behavior),
          }}
          onmousedown={handlePageBtnPress(PreferencePages.Behavior)}
        >
          Behavior
        </button>
        <button
          class={{
            [NavSidebar.button]: true,
            [NavSidebar.active]: sig.eq(page, PreferencePages.Advanced),
          }}
          onmousedown={handlePageBtnPress(PreferencePages.Advanced)}
        >
          Advanced
        </button>
      </div>
      <Switch
        value={page}
        into={<div class="preferences-main" />}
      >
        <Case match={PreferencePages.Appearance}>
          {() => <AppearanceSettings explorer={props.explorer} />}
        </Case>
        <Case match={PreferencePages.Behavior}>
          {() => <BehaviorSettings explorer={props.explorer} />}
        </Case>
        <Case match={PreferencePages.Advanced}>
          {() => <AdvancedSettings explorer={props.explorer} />}
        </Case>
      </Switch>
    </div>
  );
}

function PreferencesWindowHeader(props: {
  explorer: Explorer;
}) {
  return (
    <div class="top-header">
      <button
        class={Button.className({ flat: true, shape: "circular" })}
        onclick={() => props.explorer.overlay.close()}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function AppearanceSettings(props: {
  explorer: Explorer;
}) {
  const { explorer } = props;
  const { windowStyles, userSettings } = explorer;
  const { fontSize } = windowStyles;
  const {
    thumbnailsInPreview,
    dateTimeFormat,
    galleryThumbnailSize,
    showSizeColumn,
    showTypeColumn,
    showModifiedColumn,
    alwaysShowTabBar,
  } = userSettings;

  const handleFontSizeChange = (newValue: string | null) => {
    const v = Number(newValue);
    if (newValue != null && !Number.isNaN(v)) {
      fontSize.dispatch(`${v}px`);
    } else {
      fontSize.dispatch("inherit");
    }
  };

  const handleDateTimeFormatChange = (newValue: string | null) => {
    if (newValue) {
      dateTimeFormat.dispatch(newValue);
    }
  };

  const handleGalleryThumbnailSizeChange = (newValue: string | null) => {
    const v = Number(newValue);
    if (
      newValue != null
      && (GALLERY_THUMBNAIL_SIZES as readonly number[]).includes(v)
    ) {
      galleryThumbnailSize.dispatch(v);
    }
  };

  const handleShowHeaderChange = (newValue: boolean) => {
    explorer.showFileviewHeader.dispatch(newValue);
  };

  const handleShowLeftPaneChange = (newValue: boolean) => {
    explorer.hideLeftPane.dispatch(!newValue);
  };

  return (
    <div class="dcontents">
      <PreferencesWindowHeader explorer={props.explorer} />
      <div class={["settings-grid", ScrollView.scrollView]}>
        <SelectionPreferenceRow
          explorer={explorer}
          label="Font size"
          onChange={handleFontSizeChange}
          options={[
            {
              label: "Default",
              value: "inherit",
              selected: fontSize.get() === "inherit",
            },
            {
              label: "10px",
              value: "10",
              selected: fontSize.get() === "10px",
            },
            {
              label: "11px",
              value: "11",
              selected: fontSize.get() === "11px",
            },
            {
              label: "12px",
              value: "12",
              selected: fontSize.get() === "12px",
            },
            {
              label: "13px",
              value: "13",
              selected: fontSize.get() === "13px",
            },
            {
              label: "14px",
              value: "14",
              selected: fontSize.get() === "14px",
            },
            {
              label: "15px",
              value: "15",
              selected: fontSize.get() === "15px",
            },
            {
              label: "16px",
              value: "16",
              selected: fontSize.get() === "16px",
            },
            {
              label: "17px",
              value: "17",
              selected: fontSize.get() === "17px",
            },
            {
              label: "18px",
              value: "18",
              selected: fontSize.get() === "18px",
            },
            {
              label: "19px",
              value: "19",
              selected: fontSize.get() === "19px",
            },
            {
              label: "20px",
              value: "20",
              selected: fontSize.get() === "20px",
            },
            {
              label: "21px",
              value: "21",
              selected: fontSize.get() === "21px",
            },
            {
              label: "22px",
              value: "22",
              selected: fontSize.get() === "22px",
            },
            {
              label: "23px",
              value: "23",
              selected: fontSize.get() === "23px",
            },
            {
              label: "24px",
              value: "24",
              selected: fontSize.get() === "24px",
            },
          ]}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Show list header"
          defaultValue={explorer.showFileviewHeader.get()}
          onChange={handleShowHeaderChange}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Show size column"
          defaultValue={showSizeColumn.get()}
          onChange={(v) => showSizeColumn.dispatch(v)}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Show file type column"
          defaultValue={showTypeColumn.get()}
          onChange={(v) => showTypeColumn.dispatch(v)}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Show date modified column"
          defaultValue={showModifiedColumn.get()}
          onChange={(v) => showModifiedColumn.dispatch(v)}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Show left pane"
          defaultValue={!explorer.hideLeftPane.get()}
          onChange={handleShowLeftPaneChange}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Show thumbnail in preview"
          defaultValue={thumbnailsInPreview.get()}
          onChange={(v) => thumbnailsInPreview.dispatch(v)}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Always show tab bar"
          defaultValue={alwaysShowTabBar.get()}
          onChange={(v) => alwaysShowTabBar.dispatch(v)}
        />
        <SelectionPreferenceRow
          explorer={explorer}
          label="Date and time format"
          onChange={handleDateTimeFormatChange}
          options={[
            {
              label: "2026-10-26 13:58:00",
              value: "yyyy-MM-dd HH:mm:ss",
              selected: dateTimeFormat.get() === "yyyy-MM-dd HH:mm:ss",
            },
            {
              label: "26/10/2026 13:58",
              value: "dd/MM/yyyy HH:mm",
              selected: dateTimeFormat.get() === "dd/MM/yyyy HH:mm",
            },
            {
              label: "10/26/2026 1:58 PM",
              value: "MM/dd/yyyy h:mm a",
              selected: dateTimeFormat.get() === "MM/dd/yyyy h:mm a",
            },
            {
              label: "26 Oct 2026, 13:58",
              value: "dd MMM yyyy, HH:mm",
              selected: dateTimeFormat.get() === "dd MMM yyyy, HH:mm",
            },
          ]}
        />
        <SelectionPreferenceRow
          explorer={explorer}
          label="Gallery icon size"
          onChange={handleGalleryThumbnailSizeChange}
          options={GALLERY_THUMBNAIL_SIZES.map((size) => ({
            label: GALLERY_SIZE_LABELS[size],
            value: String(size),
            selected: galleryThumbnailSize.get() === size,
          }))}
        />
        <CustomPreferences
          category={PreferencePages.Appearance}
          explorer={explorer}
          customPreferences={explorer.options.customPreferences}
        />
      </div>
    </div>
  );
}

function BehaviorSettings(props: {
  explorer: Explorer;
}) {
  const { explorer } = props;
  const { userSettings, noPreview } = explorer;
  const {
    openOnDoubleClick,
    openPreviewOnClick,
    confirmBeforeDelete,
    doubleClickInterval,
  } = userSettings;

  const handleDoubleClickIntervalChange = (newValue: string): string => {
    const n = Number(newValue);
    if (Number.isNaN(n) || n < 20) {
      return String(doubleClickInterval.get());
    }
    const clamped = Math.min(n, 5000);
    doubleClickInterval.dispatch(clamped);
    return String(clamped);
  };

  return (
    <div class="grid-container">
      <PreferencesWindowHeader explorer={props.explorer} />
      <div class={["settings-grid", ScrollView.scrollView]}>
        <SwitchPreferenceRow
          explorer={explorer}
          label="Open on double-click"
          defaultValue={openOnDoubleClick.get()}
          onChange={(v) => openOnDoubleClick.dispatch(v)}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Never show preview"
          defaultValue={noPreview.get()}
          onChange={(v) => noPreview.dispatch(v)}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Open preview on mouse click"
          defaultValue={openPreviewOnClick.get()}
          onChange={(v) => openPreviewOnClick.dispatch(v)}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Confirm before deleting"
          defaultValue={confirmBeforeDelete.get()}
          onChange={(v) => confirmBeforeDelete.dispatch(v)}
        />
        <InputPreferenceRow
          explorer={explorer}
          label="Double-click interval (ms)"
          defaultValue={String(doubleClickInterval.get())}
          inputType="number"
          onChange={handleDoubleClickIntervalChange}
        />
        <CustomPreferences
          category={PreferencePages.Behavior}
          explorer={explorer}
          customPreferences={explorer.options.customPreferences}
        />
      </div>
    </div>
  );
}

function AdvancedSettings(props: {
  explorer: Explorer;
}) {
  const { explorer } = props;
  const { userSettings } = explorer;
  const { startupDir, askBeforeOverwrite, calculateDirSize, showDirSizes } =
    userSettings;

  const handleStartupDirChange = (newValue: string): string => {
    const trimmed = newValue.trim();
    if (!trimmed || !trimmed.startsWith("/")) {
      return startupDir.get();
    }
    const normalized = Path.from(trimmed).normalize().toString();
    startupDir.dispatch(normalized);
    return normalized;
  };

  return (
    <div class="dcontents">
      <PreferencesWindowHeader explorer={props.explorer} />
      <div class={["settings-grid", ScrollView.scrollView]}>
        <InputPreferenceRow
          explorer={explorer}
          label="Startup directory"
          defaultValue={startupDir.get()}
          placeholder="/"
          onChange={handleStartupDirChange}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Ask before overwriting files"
          defaultValue={askBeforeOverwrite.get()}
          onChange={(v) => askBeforeOverwrite.dispatch(v)}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Calculate directory sizes in preview"
          defaultValue={calculateDirSize.get()}
          onChange={(v) => calculateDirSize.dispatch(v)}
        />
        <SwitchPreferenceRow
          explorer={explorer}
          label="Show directory sizes in file list"
          defaultValue={showDirSizes.get()}
          onChange={(v) => showDirSizes.dispatch(v)}
        />
        <CustomPreferences
          category={PreferencePages.Advanced}
          explorer={explorer}
          customPreferences={explorer.options.customPreferences}
        />
      </div>
    </div>
  );
}

function CustomPreferences(props: {
  explorer: Explorer;
  category: PreferencePages;
  customPreferences?: Array<
    InputPreference | SwitchPreference | SelectionPreference
  >;
}) {
  const cat =
    props.customPreferences?.filter(p => p.category === props.category) ?? [];

  return (
    <>
      {cat.map(p => {
        switch (p.type) {
          case "input":
            return <InputPreferenceRow {...p} explorer={props.explorer} />;
          case "select":
            return <SelectionPreferenceRow {...p} explorer={props.explorer} />;
          case "switch":
            return <SwitchPreferenceRow {...p} explorer={props.explorer} />;
        }
      })}
    </>
  );
}

function ctx(props: {
  explorer: Explorer;
}): PreferenceContext {
  return {
    explorer: props.explorer,
    storage: props.explorer.options.storage ?? localStorage,
  };
}

function InputPreferenceRow(
  props: Omit<InputPreference, "category" | "type"> & { explorer: Explorer },
) {
  return (
    <>
      <div class="label-container">
        <span class={Typography.text}>{props.label}</span>
      </div>

      <input
        class={Input.input}
        placeholder={props.placeholder}
        value={props.defaultValue}
        type={props.inputType}
        autocomplete={props.autocomplete ?? "off"}
        onchange={e => {
          const normalized = props.onChange(e.target.value, ctx(props));
          if (typeof normalized === "string") {
            e.target.value = normalized;
          }
        }}
      />
    </>
  );
}

function SwitchPreferenceRow(
  props: Omit<SwitchPreference, "category" | "type"> & { explorer: Explorer },
) {
  return (
    <>
      <div class="label-container">
        <span class={Typography.text}>{props.label}</span>
      </div>

      <adw-switch
        active={!!props.defaultValue}
        onchange={e => {
          props.onChange(e.active, ctx(props));
        }}
      />
    </>
  );
}

function SelectionPreferenceRow(
  props: Omit<SelectionPreference, "category" | "type"> & {
    explorer: Explorer;
  },
) {
  return (
    <>
      <div class="label-container">
        <span class={Typography.text}>{props.label}</span>
      </div>

      <adw-selector
        allowUnselect={props.showNullOption}
        unselectLabel={props.nullOptionLabel}
        orientation="detect"
        onchange={(e) => {
          props.onChange(e.value, ctx(props));
        }}
      >
        {props.options.map((opt) => (
          <adw-option
            value={opt.value}
            selected={opt.selected}
          >
            {opt.label}
          </adw-option>
        ))}
      </adw-selector>
    </>
  );
}
