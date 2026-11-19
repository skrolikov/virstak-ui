import type { ReactNode, RefObject } from "react";

import { OverlayContext } from "./overlay-context";

export type OverlayProviderProps = {
  children: ReactNode;
  container?: HTMLElement | null;
  source?: HTMLElement | RefObject<HTMLElement | null> | null;
};

export function OverlayProvider({
  children,
  container = null,
  source = null,
}: OverlayProviderProps) {
  return (
    <OverlayContext.Provider value={{ container, source }}>
      {children}
    </OverlayContext.Provider>
  );
}
