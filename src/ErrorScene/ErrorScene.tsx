import { ArrowLeft, Home } from "lucide-react";
import type { ReactNode } from "react";

import { cx } from "../lib/cx";

import styles from "./ErrorScene.module.css";

export type ErrorAction = {
  label: string;
  onClick: () => void;
  tone?: "primary" | "ghost";
  icon?: "home" | "back";
};

const icons = {
  home: Home,
  back: ArrowLeft,
};

export function ErrorScene({
  code,
  title,
  description,
  image,
  alt,
  actions,
  note,
}: {
  code: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  actions: ErrorAction[];
  note?: ReactNode;
}) {
  return (
    <section className={styles.scene}>
      <div className={styles.frame}>
        <img className={styles.art} src={image} alt={alt} />
        <div className={styles.copy}>
          <div className={styles.panel}>
            <p className={styles.code} data-text={code}>
              {code}
            </p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.text}>{description}</p>
            {note ? <p className={styles.note}>{note}</p> : null}
            <div className={styles.actions}>
              {actions.map((action) => (
                <SceneButton key={action.label} action={action} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SceneButton({ action }: { action: ErrorAction }) {
  const Icon = action.icon ? icons[action.icon] : null;
  return (
    <button
      type="button"
      className={cx(
        styles.btn,
        action.tone === "ghost" ? styles.btnGhost : styles.btnPrimary,
      )}
      onClick={action.onClick}
    >
      {Icon ? <Icon size={16} strokeWidth={2.4} /> : null}
      {action.label}
    </button>
  );
}
