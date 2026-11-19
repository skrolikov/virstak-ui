import { createContext, type RefObject } from "react";

export type OverlayContextValue = {
  container: HTMLElement | null;
  source: HTMLElement | RefObject<HTMLElement | null> | null;
};

export const OverlayContext = createContext<OverlayContextValue | null>(null);

export const OVERLAY_SCOPE_ATTRS = [
  "data-theme",
  "data-design",
  "data-product",
] as const;

export type OverlayScopeAttrs = Partial<
  Record<(typeof OVERLAY_SCOPE_ATTRS)[number], string>
>;

export function resolveOverlaySource(
  source: OverlayContextValue["source"],
): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (source && "current" in source) return source.current;
  if (source) return source;
  return (
    document.querySelector<HTMLElement>("[data-product]") ??
    document.documentElement
  );
}

export function readOverlayScopeAttrs(
  source: HTMLElement | null,
): OverlayScopeAttrs {
  if (typeof document === "undefined") return {};
  const html = document.documentElement;
  const themeHost = source ?? html;
  const productHost =
    source?.closest("[data-product]") ??
    source ??
    document.querySelector("[data-product]");
  const attrs: OverlayScopeAttrs = {};
  const theme =
    themeHost.getAttribute("data-theme") || html.getAttribute("data-theme");
  const design =
    themeHost.getAttribute("data-design") || html.getAttribute("data-design");
  const product = productHost?.getAttribute("data-product");
  if (theme) attrs["data-theme"] = theme;
  if (design) attrs["data-design"] = design;
  if (product) attrs["data-product"] = product;
  return attrs;
}
