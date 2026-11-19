import { forwardRef, type InputHTMLAttributes } from "react";

import { cx } from "../lib/cx";

import styles from "./InlineInput.module.css";

export type InlineInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  suffix?: string;
  prefix?: string;
  align?: "left" | "center" | "right";
  inputSize?: "sm" | "md";
};

export const InlineInput = forwardRef<HTMLInputElement, InlineInputProps>(
  function InlineInput(
    {
      className,
      suffix,
      prefix,
      align = "left",
      inputSize = "md",
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <label
        className={cx(
          styles.root,
          styles[align],
          styles[inputSize],
          disabled && styles.disabled,
          className,
        )}
      >
        {prefix ? <span className={styles.affix}>{prefix}</span> : null}
        <input
          ref={ref}
          className={styles.input}
          disabled={disabled}
          {...props}
        />
        {suffix ? <span className={styles.affix}>{suffix}</span> : null}
      </label>
    );
  },
);
