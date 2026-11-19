import type { ReactNode } from "react";

export type SkyDurableRef = {
  kind: string;
  entityId: string;
  tab?: string;
};

export type SkyDrawerPanelOptions = {
  /** Stable id. Re-opening the same id focuses/replaces that level. */
  id?: string;
  title: ReactNode;
  /** Plain label for crumbs / title attribute when title is not a string */
  titleText?: string;
  description?: string;
  width?: number;
  /**
   * Near-fullscreen panel. A frame of the wallpaper stays visible around it.
   * Nested panels keep their own width.
   */
  stage?: boolean;
  content: ReactNode;
  footer?: ReactNode;
  /** Extra header controls rendered before the close button. */
  headerActions?: ReactNode;
  /**
   * Durable panel. The host adapter writes it to history so refresh and Back
   * restore or close one level.
   */
  skyRef?: SkyDurableRef;
};

export type SkyDrawerPanel = {
  id: string;
  title: ReactNode;
  titleText: string;
  description?: string;
  width: number;
  stage: boolean;
  content: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
};

export type SkyDrawerContextValue = {
  stack: SkyDrawerPanel[];
  /** Id of the expanded sheet. Null when only pinned spines are docked. */
  frontId: string | null;
  pinnedIds: readonly string[];
  open: (options: SkyDrawerPanelOptions) => string;
  close: (id?: string) => void;
  closeAll: () => void;
  /** Drop unpinned panels in front of this one and show it. Pins stay. */
  focusLevel: (id: string) => void;
  replace: (id: string, options: SkyDrawerPanelOptions) => void;
  togglePin: (id: string) => void;
  /** Expand a pinned panel without dropping the pin. */
  revealPin: (id: string) => void;
  /** Pinned drawers parked off-screen. They survive navigation. */
  hiddenPins: readonly { id: string; titleText: string }[];
  /** Take a pinned drawer off the screen without forgetting it. */
  hidePin: (id: string) => void;
  /** Open a parked pin on the current page. */
  restorePin: (id: string) => void;
};

export type SkyDrawerAdapter = {
  pathKey: string;
  durableRefs: SkyDurableRef[];
  writeDurable: (next: SkyDurableRef[], mode: "push" | "replace") => void;
  popDurable: (count: number) => void;
  resolveDurable: (ref: SkyDurableRef) => SkyDrawerPanelOptions | null;
  panelId: (ref: SkyDurableRef) => string;
  sameRef: (a: SkyDurableRef, b: SkyDurableRef) => boolean;
  serialize: (refs: SkyDurableRef[]) => string;
};
