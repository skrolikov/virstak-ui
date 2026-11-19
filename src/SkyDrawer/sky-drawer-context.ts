import { createContext } from "react";

import type { SkyDrawerContextValue } from "./types";

export const SkyDrawerContext = createContext<SkyDrawerContextValue | null>(
  null,
);

export const DEFAULT_SKY_WIDTH = 440;
