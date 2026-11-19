import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { useOverlayPortal } from "./useOverlayPortal";

import styles from "./OverlayPortal.module.css";

export function OverlayPortal({ children }: { children: ReactNode }) {
  const { target, attrs } = useOverlayPortal();
  if (!target) return null;
  return createPortal(
    <div className={styles.host} data-virstak-overlay="" {...attrs}>
      {children}
    </div>,
    target,
  );
}
