import type { ReactNode } from "react";

import { Sparkline } from "../canvas";

import styles from "./StatCard.module.css";

export type StatCardProps = {
  label: string;
  value: string;
  spark: number[];
  /** Optional sub-value displayed between label and main value */
  subValue?: ReactNode;
  /** Override the accent color for this card */
  accent?: string;
};

export function StatCard({
  label,
  value,
  spark,
  subValue,
  accent,
}: StatCardProps) {
  return (
    <div className={styles.card} style={accent ? { ["--stat-accent" as string]: accent } : undefined}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {spark.length > 0 && (
          <div className={styles.sparkline}>
            <Sparkline values={spark} />
          </div>
        )}
      </div>
      <div className={styles.content}>
        {subValue ? <div className={styles.subValue}>{subValue}</div> : null}
        <div className={styles.value}>{value}</div>
      </div>
    </div>
  );
}
