import { forwardRef, useId, type SelectHTMLAttributes } from "react";

import { cx } from "../lib/cx";

import styles from "./Select.module.css";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, hint, error, options, placeholder, className, id, ...props },
    ref,
  ) {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <label className={cx(styles.field, className)} htmlFor={selectId}>
        {label ? <span className={styles.label}>{label}</span> : null}
        <select
          ref={ref}
          id={selectId}
          className={cx(styles.select, Boolean(error) && styles.error)}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className={styles.errorText}>{error}</span>
        ) : hint ? (
          <span className={styles.hint}>{hint}</span>
        ) : null}
      </label>
    );
  },
);
