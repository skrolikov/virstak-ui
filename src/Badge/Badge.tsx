import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../lib/cx";

import styles from "./Badge.module.css";

export type BadgeTone =
  "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], className)} {...props}>
      {children}
    </span>
  );
}
