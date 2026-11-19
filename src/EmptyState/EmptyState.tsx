import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cx } from "../lib/cx";

import styles from "./EmptyState.module.css";

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.icon}>{icon ?? <Inbox size={22} />}</div>
      <div className={styles.title}>{title}</div>
      {description ? <p className={styles.description}>{description}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
