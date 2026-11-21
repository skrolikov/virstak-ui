import { createContext } from "react";

/** Resolved theme applied to the document */
export type ThemeMode = "dark" | "light";

/** User preference (may follow OS) */
export type ThemePreference = "dark" | "light" | "system";

export type ThemeContextValue = {
  /** Resolved light/dark currently on the document */
  theme: ThemeMode;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** @deprecated use setPreference — flips resolved light/dark as explicit preference */
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "virstak.theme";
export const THEME_PREFERENCE_KEY = "virstak.theme-preference";
