import { useContext } from "react";

import { SkyDrawerContext } from "./sky-drawer-context";

export function useSkyDrawer() {
  const context = useContext(SkyDrawerContext);
  if (!context) {
    throw new Error("useSkyDrawer must be used within SkyDrawerProvider");
  }
  return context;
}
