import { act, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "../src/theme";

function Probe() {
  const { theme, preference, toggleTheme, setPreference } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="preference">{preference}</span>
      <button type="button" onClick={toggleTheme}>
        Переключить
      </button>
      <button type="button" onClick={() => setPreference("system")}>
        Система
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("restores the saved theme after hydration without changing the server markup", async () => {
    const view = (
      <ThemeProvider storageKey="hydrate.pref" resolvedStorageKey="hydrate.resolved">
        <Probe />
      </ThemeProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(view);
    document.body.append(container);
    window.localStorage.setItem("hydrate.pref", "light");
    const onRecoverableError = vi.fn();
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, view, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.querySelector('[data-testid="theme"]')).toHaveTextContent("light");
      expect(window.localStorage.getItem("hydrate.pref")).toBe("light");
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      window.localStorage.removeItem("hydrate.pref");
      window.localStorage.removeItem("hydrate.resolved");
    }
  });

  it("writes data-theme and storage keys", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider
        storageKey="test.pref"
        resolvedStorageKey="test.resolved"
        defaultPreference="dark"
      >
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });
    expect(screen.getByTestId("preference")).toHaveTextContent("dark");
    await user.click(screen.getByRole("button", { name: "Переключить" }));
    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });
    expect(window.localStorage.getItem("test.pref")).toBe("light");
    expect(window.localStorage.getItem("test.resolved")).toBe("light");
  });

  it("follows system preference when asked", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query.includes("prefers-color-scheme: dark"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });
    render(
      <ThemeProvider storageKey="sys.pref" resolvedStorageKey="sys.resolved">
        <Probe />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Система" }));
    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("preference")).toHaveTextContent("system");
    });
  });
});
