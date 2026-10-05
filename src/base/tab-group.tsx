import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Explorer } from "../explorer";
import { Path } from "../utils/path";
import { TabController } from "./tab-controller";

let i = 0;

export class TabGroup {
  public readonly id = Symbol(`TAB_GROUP_${i++}`);
  public readonly tabs;
  public readonly activeTabID;
  public readonly activeTab;

  constructor(
    protected explorer: Explorer,
    protected cleanups: Array<() => void>,
  ) {
    this.tabs = sig<ReadonlyArray<TabController>>([
      new TabController(this.explorer, this.cleanups),
    ]);
    this.activeTabID = sig(this.tabs.get()[0]!.id);
    this.activeTab = sig.derive(this.tabs, this.activeTabID, (tabs, id) => {
      return tabs.find(t => t.id === id) ?? tabs[0]!;
    });
  }

  initiate() {
    for (const tab of this.tabs.get()) {
      tab.initiate();
    }
  }

  addTab(initLocation?: Path | string) {
    const tab = new TabController(this.explorer, this.cleanups);
    this.tabs.dispatch(current => current.concat(tab));
    this.activeTabID.dispatch(tab.id);
    this.explorer.activeTabGroup.dispatch(this.id);
    tab.initiate();
    if (initLocation) {
      tab.history.replace(initLocation);
    }
    return tab;
  }

  closeTab(id: symbol) {
    const currentTabs = this.tabs.get();
    const newTabs = currentTabs.filter(tab => tab.id !== id);
    if (newTabs.length === 0) return;

    sig.startBatch();
    this.tabs.dispatch(newTabs);
    if (this.activeTabID.get() === id) {
      const newActiveTab = newTabs[0];
      if (newActiveTab) {
        this.activeTabID.dispatch(newActiveTab.id);
      }
    }
    sig.commitBatch();
  }

  refresh(dir?: string) {
    for (const tab of this.tabs.get()) {
      tab.refresh(dir);
    }
  }

  hasTab(id: symbol) {
    const tabs = this.tabs.get();
    return tabs.some(tab => tab.id === id);
  }

  focusTab(id: symbol) {
    const tabs = this.tabs.get();
    if (tabs.some(tab => tab.id === id)) {
      this.activeTabID.dispatch(id);
      this.explorer.activeTabGroup.dispatch(this.id);
    }
  }
}
