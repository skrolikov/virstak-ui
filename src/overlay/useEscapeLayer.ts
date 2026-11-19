import { useEffect } from "react";

type EscapeHandler = () => void;

const stack: EscapeHandler[] = [];

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  const top = stack[stack.length - 1];
  if (!top) return;
  event.stopPropagation();
  top();
}

export function registerEscapeLayer(handler: EscapeHandler) {
  if (typeof document === "undefined") return () => {};
  stack.push(handler);
  if (stack.length === 1) {
    document.addEventListener("keydown", onKeyDown);
  }
  return () => {
    const index = stack.lastIndexOf(handler);
    if (index >= 0) stack.splice(index, 1);
    if (stack.length === 0) {
      document.removeEventListener("keydown", onKeyDown);
    }
  };
}

export function useEscapeLayer(active: boolean, handler: EscapeHandler) {
  useEffect(() => {
    if (!active) return;
    return registerEscapeLayer(handler);
  }, [active, handler]);
}
