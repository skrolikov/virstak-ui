import { cx } from "../lib/cx";

import styles from "./PageLoader.module.css";

export type PageLoaderProps = {
  label?: string;
  className?: string;
};

export function PageLoader({
  label = "Загрузка…",
  className,
}: PageLoaderProps) {
  return (
    <div className={cx(styles.root, className)} role="status">
      <div className={styles.spinner} aria-hidden />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
