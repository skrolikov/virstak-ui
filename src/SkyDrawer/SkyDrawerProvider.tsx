import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { noopSkyAdapter } from "./adapter";
import { SkyDrawerHost } from "./SkyDrawerHost";
import { frontIndexOf } from "./sky-layout";
import { DEFAULT_SKY_WIDTH, SkyDrawerContext } from "./sky-drawer-context";
import type {
  SkyDrawerAdapter,
  SkyDrawerPanel,
  SkyDrawerPanelOptions,
  SkyDurableRef,
} from "./types";

type DurableEntry = {
  panel: SkyDrawerPanel;
  ref: SkyDurableRef;
};

type KeptDrawer = {
  id: string;
  titleText: string;
  skyRef?: SkyDurableRef;
  panel?: SkyDrawerPanel;
  hidden: boolean;
};

function refKey(ref?: SkyDurableRef) {
  if (!ref) return "";
  return `${ref.kind}:${ref.entityId}:${ref.tab ?? ""}`;
}

function sameKept(a: KeptDrawer[], b: KeptDrawer[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (item, index) =>
      item.id === b[index].id &&
      item.hidden === b[index].hidden &&
      item.titleText === b[index].titleText &&
      item.panel === b[index].panel &&
      refKey(item.skyRef) === refKey(b[index].skyRef),
  );
}

export type SkyDrawerProviderProps = {
  children: ReactNode;
  adapter?: SkyDrawerAdapter;
};

let skyUid = 0;

function createId(prefix = "sky") {
  skyUid += 1;
  return `${prefix}-${skyUid}`;
}

function toPanel(id: string, options: SkyDrawerPanelOptions): SkyDrawerPanel {
  return {
    id,
    title: options.title,
    titleText:
      options.titleText ??
      (typeof options.title === "string" ? options.title : "Панель"),
    description: options.description,
    width: options.width ?? DEFAULT_SKY_WIDTH,
    stage: options.stage ?? false,
    content: options.content,
    footer: options.footer,
    headerActions: options.headerActions,
  };
}

export function SkyDrawerProvider({
  children,
  adapter: adapterProp,
}: SkyDrawerProviderProps) {
  const adapter = adapterProp ?? noopSkyAdapter;
  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;

  const [ephemeral, setEphemeral] = useState<SkyDrawerPanel[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [openedPinId, setOpenedPinId] = useState<string | null>(null);
  const [kept, setKept] = useState<KeptDrawer[]>([]);
  const ephemeralRef = useRef(ephemeral);
  const pinnedRef = useRef(pinnedIds);
  const openedPinRef = useRef(openedPinId);
  const keptRef = useRef(kept);
  ephemeralRef.current = ephemeral;
  pinnedRef.current = pinnedIds;
  openedPinRef.current = openedPinId;
  keptRef.current = kept;

  const pathSeen = useRef(adapter.pathKey);

  if (pathSeen.current !== adapter.pathKey) {
    pathSeen.current = adapter.pathKey;
    const pinned = new Set(pinnedRef.current);
    const fleeing = ephemeralRef.current.filter((panel) => pinned.has(panel.id));
    ephemeralRef.current = [];
    setEphemeral([]);
    setOpenedPinId(null);
    setKept((current) => {
      const extras = fleeing
        .filter((panel) => !current.some((item) => item.id === panel.id))
        .map((panel) => ({
          id: panel.id,
          titleText: panel.titleText,
          panel,
          hidden: true,
        }));
      const next = [
        ...current.map((item) =>
          pinned.has(item.id) ? { ...item, hidden: true } : item,
        ),
        ...extras,
      ];
      return sameKept(current, next) ? current : next;
    });
  }

  const durableEntries = useMemo(
    () =>
      adapter.durableRefs.flatMap((ref) => {
        const options = adapter.resolveDurable(ref);
        if (!options) return [];
        return [
          {
            panel: toPanel(options.id ?? adapter.panelId(ref), options),
            ref,
          } satisfies DurableEntry,
        ];
      }),
    [adapter],
  );
  const durableEntriesRef = useRef(durableEntries);
  durableEntriesRef.current = durableEntries;

  const durable = useMemo(
    () => durableEntries.map((entry) => entry.panel),
    [durableEntries],
  );

  const stack = useMemo(
    () => [...durable, ...ephemeral],
    [durable, ephemeral],
  );

  const frontIndex = frontIndexOf(stack, pinnedIds, openedPinId);
  const frontId = frontIndex >= 0 ? stack[frontIndex].id : null;

  const hiddenPins = useMemo(
    () =>
      kept
        .filter((item) => item.hidden)
        .map((item) => ({ id: item.id, titleText: item.titleText })),
    [kept],
  );

  useEffect(() => {
    setKept((current) => {
      const pinned = new Set(pinnedIds);
      const visible = stack.filter((panel) => pinned.has(panel.id));
      const visibleIds = new Set(visible.map((panel) => panel.id));
      const shown = visible.map((panel) => {
        const entry = durableEntries.find((item) => item.panel.id === panel.id);
        const prev = current.find((item) => item.id === panel.id);
        return {
          id: panel.id,
          titleText: panel.titleText,
          skyRef: entry?.ref ?? prev?.skyRef,
          panel: entry ? undefined : panel,
          hidden: false,
        } satisfies KeptDrawer;
      });
      const parked = current
        .filter((item) => !visibleIds.has(item.id) && pinned.has(item.id))
        .map((item) => ({ ...item, hidden: true }));
      const next = [...shown, ...parked];
      return sameKept(current, next) ? current : next;
    });
  }, [stack, pinnedIds, durableEntries]);

  useEffect(() => {
    const ids = new Set(stack.map((panel) => panel.id));
    const parked = new Set(
      kept.filter((item) => item.hidden).map((item) => item.id),
    );
    setPinnedIds((current) => {
      const next = current.filter((id) => ids.has(id) || parked.has(id));
      return next.length === current.length ? current : next;
    });
    setOpenedPinId((current) =>
      current && (ids.has(current) || pinnedIds.includes(current))
        ? current
        : null,
    );
  }, [stack, kept, pinnedIds]);

  const stackNow = useCallback(
    () => [
      ...durableEntriesRef.current.map((entry) => entry.panel),
      ...ephemeralRef.current,
    ],
    [],
  );

  const commit = useCallback((next: SkyDrawerPanel[]) => {
    const nav = adapterRef.current;
    const entries = durableEntriesRef.current;
    const durableIds = new Set(entries.map((entry) => entry.panel.id));
    const keepRefs = next.flatMap((panel) => {
      const entry = entries.find((item) => item.panel.id === panel.id);
      return entry ? [entry.ref] : [];
    });
    const nextEphemeral = next.filter((panel) => !durableIds.has(panel.id));
    ephemeralRef.current = nextEphemeral;
    setEphemeral(nextEphemeral);

    const currentRefs = entries.map((entry) => entry.ref);
    if (nav.serialize(keepRefs) === nav.serialize(currentRefs)) return;
    const prefix =
      keepRefs.length <= currentRefs.length &&
      keepRefs.every((ref, index) => nav.sameRef(ref, currentRefs[index]));
    if (prefix) {
      nav.popDurable(currentRefs.length - keepRefs.length);
      return;
    }
    nav.writeDurable(keepRefs, "replace");
  }, []);

  const open = useCallback((options: SkyDrawerPanelOptions) => {
    const nav = adapterRef.current;
    const pinned = new Set(pinnedRef.current);
    setOpenedPinId(null);

    if (options.skyRef) {
      const current = nav.durableRefs;
      const index = current.findIndex((item) =>
        nav.sameRef(item, options.skyRef as SkyDurableRef),
      );
      const entries = durableEntriesRef.current;
      const keptAfter =
        index >= 0
          ? current.slice(index + 1).filter((ref) => {
              const entry = entries.find((item) => nav.sameRef(item.ref, ref));
              return entry ? pinned.has(entry.panel.id) : false;
            })
          : [];
      const base = index >= 0 ? current.slice(0, index) : current;
      const next = [...base, options.skyRef, ...keptAfter];
      nav.writeDurable(next, index >= 0 ? "replace" : "push");
      setEphemeral((curr) => {
        const keptPins = curr.filter((panel) => pinned.has(panel.id));
        ephemeralRef.current = keptPins;
        return keptPins;
      });
      return options.id ?? nav.panelId(options.skyRef);
    }

    const id = options.id ?? createId();
    const panel = toPanel(id, options);
    setEphemeral((current) => {
      const existingIndex = current.findIndex((item) => item.id === id);
      const keptPins =
        existingIndex >= 0
          ? current
              .slice(existingIndex + 1)
              .filter((item) => pinned.has(item.id) && item.id !== id)
          : [];
      const next =
        existingIndex >= 0
          ? [...current.slice(0, existingIndex), panel, ...keptPins]
          : [...current, panel];
      ephemeralRef.current = next;
      return next;
    });
    return id;
  }, []);

  const close = useCallback(
    (id?: string) => {
      const current = stackNow();
      const pinned = new Set(pinnedRef.current);
      const index =
        id !== undefined
          ? current.findIndex((panel) => panel.id === id)
          : frontIndexOf(current, pinnedRef.current, openedPinRef.current);
      if (index < 0) return;

      if (id === undefined && pinned.has(current[index].id)) {
        setOpenedPinId(null);
        return;
      }

      const next = current.filter((panel, panelIndex) => {
        if (panelIndex < index) return true;
        if (panelIndex === index) return false;
        return pinned.has(panel.id);
      });
      const unchanged =
        next.length === current.length &&
        next.every((panel, panelIndex) => panel.id === current[panelIndex].id);
      if (!unchanged) commit(next);
      setOpenedPinId(null);
    },
    [commit, stackNow],
  );

  const focusLevel = useCallback(
    (id: string) => {
      const current = stackNow();
      const index = current.findIndex((panel) => panel.id === id);
      if (index < 0) return;
      const pinned = new Set(pinnedRef.current);
      const next = current.filter(
        (panel, panelIndex) => panelIndex <= index || pinned.has(panel.id),
      );
      const unchanged =
        next.length === current.length &&
        next.every((panel, panelIndex) => panel.id === current[panelIndex].id);
      if (!unchanged) commit(next);
      setOpenedPinId(pinned.has(id) ? id : null);
    },
    [commit, stackNow],
  );

  const closeAll = useCallback(() => {
    const pinned = new Set(pinnedRef.current);
    commit(stackNow().filter((panel) => pinned.has(panel.id)));
    setOpenedPinId(null);
  }, [commit, stackNow]);

  const replace = useCallback((id: string, options: SkyDrawerPanelOptions) => {
    setEphemeral((current) => {
      const index = current.findIndex((item) => item.id === id);
      if (index < 0) return current;
      const next = [...current.slice(0, index), toPanel(id, options)];
      ephemeralRef.current = next;
      return next;
    });
  }, []);

  const togglePin = useCallback(
    (id: string) => {
      const removing = pinnedRef.current.includes(id);
      const current = stackNow();
      const front = frontIndexOf(
        current,
        pinnedRef.current,
        openedPinRef.current,
      );
      const isFront = front >= 0 && current[front]?.id === id;
      const nextPins = removing
        ? pinnedRef.current.filter((item) => item !== id)
        : [...pinnedRef.current, id];
      pinnedRef.current = nextPins;
      setPinnedIds(nextPins);
      if (removing) {
        setOpenedPinId((opened) => (opened === id ? null : opened));
        setKept((keptNow) => keptNow.filter((item) => item.id !== id));
        return;
      }
      if (isFront) setOpenedPinId(id);
    },
    [stackNow],
  );

  const revealPin = useCallback((id: string) => {
    setOpenedPinId(id);
  }, []);

  const hidePin = useCallback(
    (id: string) => {
      const panel = stackNow().find((item) => item.id === id);
      if (!panel) return;
      const entry = durableEntriesRef.current.find((item) => item.panel.id === id);
      const prev = keptRef.current.find((item) => item.id === id);
      const snapshot: KeptDrawer = {
        id,
        titleText: panel.titleText,
        skyRef: entry?.ref ?? prev?.skyRef,
        panel: entry ? undefined : panel,
        hidden: true,
      };
      const nextKept = [
        ...keptRef.current.filter((item) => item.id !== id),
        snapshot,
      ];
      keptRef.current = nextKept;
      setKept(nextKept);
      if (!pinnedRef.current.includes(id)) {
        const nextPins = [...pinnedRef.current, id];
        pinnedRef.current = nextPins;
        setPinnedIds(nextPins);
      }
      const next = stackNow().filter((item) => item.id !== id);
      commit(next);
      if (openedPinRef.current === id) setOpenedPinId(null);
    },
    [commit, stackNow],
  );

  const restorePin = useCallback(
    (id: string) => {
      const item = keptRef.current.find((entry) => entry.id === id);
      if (!item) return;
      const nextKept = keptRef.current.map((entry) =>
        entry.id === id ? { ...entry, hidden: false } : entry,
      );
      keptRef.current = nextKept;
      setKept(nextKept);
      if (!pinnedRef.current.includes(id)) {
        const nextPins = [...pinnedRef.current, id];
        pinnedRef.current = nextPins;
        setPinnedIds(nextPins);
      }
      if (item.skyRef) {
        const options = adapterRef.current.resolveDurable(item.skyRef);
        if (!options) return;
        const panelId = options.id ?? id;
        open({ ...options, id: panelId, skyRef: item.skyRef });
        setOpenedPinId(panelId);
        return;
      }
      if (!item.panel) return;
      setEphemeral((current) => {
        if (current.some((panel) => panel.id === id)) return current;
        const next = [...current, item.panel as SkyDrawerPanel];
        ephemeralRef.current = next;
        return next;
      });
      setOpenedPinId(id);
    },
    [open],
  );

  const value = useMemo(
    () => ({
      stack,
      frontId,
      pinnedIds,
      open,
      close,
      closeAll,
      focusLevel,
      replace,
      togglePin,
      revealPin,
      hiddenPins,
      hidePin,
      restorePin,
    }),
    [
      stack,
      frontId,
      pinnedIds,
      open,
      close,
      closeAll,
      focusLevel,
      replace,
      togglePin,
      revealPin,
      hiddenPins,
      hidePin,
      restorePin,
    ],
  );

  return (
    <SkyDrawerContext.Provider value={value}>
      {children}
      <SkyDrawerHost />
    </SkyDrawerContext.Provider>
  );
}
