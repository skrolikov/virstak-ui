import { createPortal } from "react-dom";
import type { CSSProperties } from "react";

import { cx } from "../../lib/cx";

import styles from "./ChartTooltip.module.css";

export type ChartTooltipModel = {
  visible: boolean;
  x: number;
  y: number;
  label?: string;
  value: string;
  meta?: string;
  accent?: string;
};

export type ChartTooltipProps = {
  model: ChartTooltipModel;
};

export function ChartTooltip({ model }: ChartTooltipProps) {
  if (typeof document === "undefined") return null;
  if (!model.visible) return null;

  const style = {
    left: model.x,
    top: model.y,
    ["--tip-accent" as string]: model.accent ?? "#50ba88",
  } as CSSProperties;

  return createPortal(
    <div className={cx(styles.tooltip, styles.visible)} style={style} role="tooltip">
      <span className={styles.label}>{model.label ?? "Значение"}</span>
      <div className={styles.valueRow}>
        <span className={styles.dot} aria-hidden />
        <span className={styles.value}>{model.value}</span>
      </div>
      {model.meta ? <div className={styles.meta}>{model.meta}</div> : null}
    </div>,
    document.body,
  );
}
