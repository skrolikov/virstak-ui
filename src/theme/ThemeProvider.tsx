import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ThemeContext,
  THEME_PREFERENCE_KEY,
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ThemePreference,
} from "./theme-context";

function getSystemTheme(): ThemeMode {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function isPreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function isMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

function readPreference(
  storageKey: string,
  resolvedKey: string,
  fallback: ThemePreference,
): ThemePreference {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (isPreference(stored)) return stored;
    const legacy = window.localStorage.getItem(resolvedKey);
    if (isMode(legacy)) return legacy;
  } catch {
    // Embedded browsers can disable storage.
  }
  return fallback;
}

function resolveTheme(preference: ThemePreference): ThemeMode {
  return preference === "system" ? getSystemTheme() : preference;
}

function applyTheme(root: HTMLElement, attribute: string, theme: ThemeMode) {
  root.setAttribute(`data-${attribute}`, theme);
}

export type ThemeProviderProps = {
  children: ReactNode;
  storageKey?: string;
  resolvedStorageKey?: string;
  defaultPreference?: ThemePreference;
  /** HTML data attribute without the `data-` prefix. Default `theme`. */
  attribute?: string;
  root?: HTMLElement | null;
};

export function ThemeProvider({
  children,
  storageKey = THEME_PREFERENCE_KEY,
  resolvedStorageKey = THEME_STORAGE_KEY,
  defaultPreference = "dark",
  attribute = "theme",
  root = null,
}: ThemeProviderProps) {
  const [storedPreference, setPreferenceState] = useState<ThemePreference | null>(null);
  const preference = storedPreference ?? defaultPreference;
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    defaultPreference === "light" ? "light" : "dark",
  );

  useLayoutEffect(() => {
    const restored = readPreference(storageKey, resolvedStorageKey, defaultPreference);
    setPreferenceState((current) => current ?? restored);
  }, [storageKey, resolvedStorageKey, defaultPreference]);

  useLayoutEffect(() => {
    if (storedPreference === null) return;
    const target = root ?? document.documentElement;
    const update = () => {
      const next = resolveTheme(storedPreference);
      setThemeState(next);
      applyTheme(target, attribute, next);
      try {
        window.localStorage.setItem(storageKey, storedPreference);
        window.localStorage.setItem(resolvedStorageKey, next);
      } catch {
        // The theme stays active for this session without storage.
      }
    };
    update();
    if (storedPreference !== "system" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [storedPreference, storageKey, resolvedStorageKey, attribute, root]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setPreferenceState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((current) => {
      const resolved = resolveTheme(current ?? defaultPreference);
      return resolved === "dark" ? "light" : "dark";
    });
  }, [defaultPreference]);

  const value = useMemo(
    () => ({ theme, preference, setPreference, setTheme, toggleTheme }),
    [theme, preference, setPreference, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
