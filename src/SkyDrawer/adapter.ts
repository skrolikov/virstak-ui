import type { SkyDrawerAdapter, SkyDurableRef } from "./types";

export function defaultSkyPanelId(ref: SkyDurableRef): string {
  return `${ref.kind}-${ref.entityId}`;
}

export function defaultSameSkyRef(a: SkyDurableRef, b: SkyDurableRef): boolean {
  return a.kind === b.kind && a.entityId === b.entityId;
}

export function defaultSerializeSky(refs: SkyDurableRef[]): string {
  return refs
    .map((ref) =>
      ref.tab
        ? `${ref.kind}:${ref.entityId}~${ref.tab}`
        : `${ref.kind}:${ref.entityId}`,
    )
    .join(",");
}

export const noopSkyAdapter: SkyDrawerAdapter = {
  pathKey: "",
  durableRefs: [],
  writeDurable: () => {},
  popDurable: () => {},
  resolveDurable: () => null,
  panelId: defaultSkyPanelId,
  sameRef: defaultSameSkyRef,
  serialize: defaultSerializeSky,
};
