import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cx } from "../lib/cx";

import styles from "./Input.module.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftAddon,
    rightAddon,
    className,
    id,
    disabled,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={cx(styles.field, className)} htmlFor={inputId}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <span
        className={cx(styles.control, Boolean(error) && styles.controlError)}
      >
        {leftAddon ? <span className={styles.affix}>{leftAddon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {rightAddon ? <span className={styles.affix}>{rightAddon}</span> : null}
      </span>
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </label>
  );
});
