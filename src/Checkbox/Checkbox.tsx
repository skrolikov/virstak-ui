import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

import { cx } from "../lib/cx";

import styles from "./Checkbox.module.css";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
  hint?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, hint, className, id, disabled, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <label
        className={cx(styles.root, disabled && styles.disabled, className)}
        htmlFor={inputId}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={styles.input}
          disabled={disabled}
          {...props}
        />
        <span className={styles.box} aria-hidden>
          <Check className={styles.check} strokeWidth={3} />
        </span>
        <span className={styles.content}>
          <span className={styles.label}>{label}</span>
          {hint ? <span className={styles.hint}>{hint}</span> : null}
        </span>
      </label>
    );
  },
);
