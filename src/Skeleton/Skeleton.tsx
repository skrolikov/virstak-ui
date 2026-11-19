import type { CSSProperties, HTMLAttributes } from "react";

import { cx } from "../lib/cx";

import styles from "./Skeleton.module.css";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: number | string;
  height?: number | string;
  variant?: "rect" | "text" | "circle";
};

export function Skeleton({
  width,
  height,
  variant = "rect",
  className,
  style,
  ...props
}: SkeletonProps) {
  const mergedStyle: CSSProperties = {
    width,
    height: variant === "text" ? undefined : height,
    ...style,
  };

  return (
    <div
      className={cx(
        styles.skeleton,
        variant === "text" && styles.text,
        variant === "circle" && styles.circle,
        className,
      )}
      style={mergedStyle}
      aria-hidden
      {...props}
    />
  );
}
