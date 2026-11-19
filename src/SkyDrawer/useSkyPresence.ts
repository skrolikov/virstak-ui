import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { SKY_MOVE_MS } from "./sky-layout";
import type { SkyDrawerPanel } from "./types";

export type SkyPhase = "enter" | "open" | "leave";

export type SkyLive = {
  panel: SkyDrawerPanel;
  phase: SkyPhase;
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function sameLive(a: SkyLive[], b: SkyLive[]) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index].phase !== b[index].phase) return false;
    if (a[index].panel !== b[index].panel) return false;
  }
  return true;
}

function reconcile(current: SkyLive[], stack: SkyDrawerPanel[]): SkyLive[] {
  const ids = new Set(stack.map((panel) => panel.id));
  const previous = new Map(current.map((item) => [item.panel.id, item]));
  const reduced = prefersReducedMotion();

  const active: SkyLive[] = stack.map((panel) => {
    const prev = previous.get(panel.id);
    if (!prev || prev.phase === "leave") {
      return { panel, phase: reduced ? "open" : "enter" };
    }
    return {
      panel,
      phase: prev.phase === "enter" ? "enter" : "open",
    };
  });

  const leaving: SkyLive[] = [];
  const seen = new Set<string>();
  for (const item of current) {
    if (ids.has(item.panel.id) || seen.has(item.panel.id)) continue;
    seen.add(item.panel.id);
    leaving.push(
      item.phase === "leave" ? item : { panel: item.panel, phase: "leave" },
    );
  }

  return [...active, ...leaving];
}

export function useSkyPresence(stack: SkyDrawerPanel[]) {
  const reduceRef = useRef(prefersReducedMotion());
  const [live, setLive] = useState<SkyLive[]>(() =>
    stack.map((panel) => ({
      panel,
      phase: reduceRef.current ? "open" : "enter",
    })),
  );
  const [tracked, setTracked] = useState(stack);

  if (tracked !== stack) {
    setTracked(stack);
    setLive((current) => {
      const next = reconcile(current, stack);
      return sameLive(current, next) ? current : next;
    });
  }

  const enterKey = live
    .filter((item) => item.phase === "enter")
    .map((item) => item.panel.id)
    .join("|");

  useLayoutEffect(() => {
    if (!enterKey || reduceRef.current) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setLive((current) =>
          current.map((item) =>
            item.phase === "enter" ? { ...item, phase: "open" } : item,
          ),
        );
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [enterKey]);

  const leaveKey = live
    .filter((item) => item.phase === "leave")
    .map((item) => item.panel.id)
    .join("|");

  useEffect(() => {
    if (!leaveKey) return;
    const timeout = window.setTimeout(
      () => {
        setLive((current) => current.filter((item) => item.phase !== "leave"));
      },
      reduceRef.current ? 0 : SKY_MOVE_MS + 70,
    );
    return () => window.clearTimeout(timeout);
  }, [leaveKey]);

  return live;
}
