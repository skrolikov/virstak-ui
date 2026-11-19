import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return () => {};
  if (lockCount === 0) previousOverflow = document.body.style.overflow;
  lockCount += 1;
  document.body.style.overflow = "hidden";
  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) document.body.style.overflow = previousOverflow;
  };
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    return lockBodyScroll();
  }, [active]);
}
