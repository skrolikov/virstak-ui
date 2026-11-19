import { useLayoutEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableIn(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (node) => !node.closest("[disabled]") && node.tabIndex !== -1,
  );
}

export function useFocusTrap(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const items = focusableIn(root);
    (items[0] ?? root).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const list = focusableIn(root);
      if (list.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, ref]);
}
