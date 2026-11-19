import { useState, type HTMLAttributes } from "react";

import { cx } from "../lib/cx";

import styles from "./Avatar.module.css";

export type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
  src?: string;
  size?: AvatarSize;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={cx(styles.avatar, styles[size], className)}
      aria-label={name}
      title={name}
      {...props}
    >
      {showImage ? (
        <img
          className={styles.image}
          src={src}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
