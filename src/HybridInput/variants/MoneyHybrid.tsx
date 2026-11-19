import { useId, useMemo, useState } from "react";

import { cx } from "../../lib/cx";

import styles from "../HybridInput.module.css";
import type { HybridMoneyProps } from "../types";

function formatDisplay(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(value);
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function MoneyHybrid({
  label,
  hint,
  error,
  placeholder = "0",
  disabled,
  className,
  value,
  onChange,
  min = 0,
  currency = "₽",
}: HybridMoneyProps) {
  const fieldId = useId();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const display = useMemo(() => {
    if (focused) return draft;
    return formatDisplay(value);
  }, [focused, draft, value]);

  return (
    <div className={cx(styles.field, className)}>
      {label ? (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <div
        className={cx(
          styles.control,
          Boolean(error) && styles.controlError,
          disabled && styles.controlDisabled,
        )}
      >
        <input
          id={fieldId}
          className={styles.input}
          inputMode="decimal"
          disabled={disabled}
          placeholder={placeholder}
          value={display}
          onFocus={() => {
            setFocused(true);
            setDraft(value == null ? "" : String(value));
          }}
          onBlur={() => {
            setFocused(false);
            const parsed = parseMoney(draft);
            if (parsed == null) {
              onChange(null);
              return;
            }
            onChange(Math.max(min, parsed));
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            const parsed = parseMoney(e.target.value);
            if (parsed != null) onChange(Math.max(min, parsed));
            if (!e.target.value) onChange(null);
          }}
        />
        <span className={styles.moneyAffix}>{currency}</span>
      </div>
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </div>
  );
}
