import { useContext, useLayoutEffect, useState } from "react";

import {
  OverlayContext,
  OVERLAY_SCOPE_ATTRS,
  readOverlayScopeAttrs,
  resolveOverlaySource,
  type OverlayScopeAttrs,
} from "./overlay-context";

function currentTarget(
  container: HTMLElement | null | undefined,
): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return container ?? document.body;
}

export function useOverlayPortal() {
  const ctx = useContext(OverlayContext);
  const target = currentTarget(ctx?.container);
  const [attrs, setAttrs] = useState<OverlayScopeAttrs>(() =>
    readOverlayScopeAttrs(resolveOverlaySource(ctx?.source ?? null)),
  );

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;

    const update = () => {
      setAttrs(readOverlayScopeAttrs(resolveOverlaySource(ctx?.source ?? null)));
    };
    update();

    const html = document.documentElement;
    const observed = new Set<Node>([html]);
    const product = document.querySelector("[data-product]");
    if (product) observed.add(product);
    const source = resolveOverlaySource(ctx?.source ?? null);
    if (source) observed.add(source);

    const observer = new MutationObserver(update);
    for (const node of observed) {
      observer.observe(node, {
        attributes: true,
        attributeFilter: [...OVERLAY_SCOPE_ATTRS],
      });
    }
    return () => observer.disconnect();
  }, [ctx?.container, ctx?.source]);

  return { target, attrs };
}
