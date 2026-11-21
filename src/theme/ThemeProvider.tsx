import {
  useCallback,
  useEffect,
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
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(storageKey);
  if (isPreference(stored)) return stored;
  const legacy = window.localStorage.getItem(resolvedKey);
  if (isMode(legacy)) return legacy;
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
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readPreference(storageKey, resolvedStorageKey, defaultPreference),
  );
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    resolveTheme(
      readPreference(storageKey, resolvedStorageKey, defaultPreference),
    ),
  );

  useEffect(() => {
    const next = resolveTheme(preference);
    const target = root ?? document.documentElement;
    setThemeState(next);
    applyTheme(target, attribute, next);
    window.localStorage.setItem(storageKey, preference);
    window.localStorage.setItem(resolvedStorageKey, next);
  }, [preference, storageKey, resolvedStorageKey, attribute, root]);

  useEffect(() => {
    if (preference !== "system") return;
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = getSystemTheme();
      const target = root ?? document.documentElement;
      setThemeState(next);
      applyTheme(target, attribute, next);
      window.localStorage.setItem(resolvedStorageKey, next);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference, resolvedStorageKey, attribute, root]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setPreferenceState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((current) => {
      const resolved = resolveTheme(current);
      return resolved === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({ theme, preference, setPreference, setTheme, toggleTheme }),
    [theme, preference, setPreference, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
