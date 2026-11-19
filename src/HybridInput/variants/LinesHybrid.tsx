import { useMemo } from "react";
import { Trash2 } from "lucide-react";

import { cx } from "../../lib/cx";

import styles from "../HybridInput.module.css";
import {
  type HybridLine,
  type HybridLinesProps,
  type HybridOption,
} from "../types";
import { SearchHybrid } from "./SearchHybrid";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function makeKey() {
  return `hline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function LinesHybrid({
  label,
  hint,
  error,
  placeholder = "Добавить позицию…",
  disabled,
  className,
  createMode = "none",
  createLabel,
  onCreate,
  onCreateRequest,
  options,
  value,
  onChange,
  filter,
  columns = ["qty", "cost", "sum"],
  getOptionMeta,
}: HybridLinesProps) {
  const selectedIds = useMemo(
    () => new Set(value.map((line) => line.optionId).filter(Boolean)),
    [value],
  );

  const availableOptions = useMemo(
    () => options.filter((opt) => !selectedIds.has(opt.id)),
    [options, selectedIds],
  );

  const showExpected = columns.includes("expected") || columns.includes("diff");
  const showCost = columns.includes("cost");
  const showSum = columns.includes("sum");
  const showDiff = columns.includes("diff");

  const total = useMemo(
    () =>
      value.reduce(
        (sum, line) => sum + line.quantity * (line.costPrice ?? 0),
        0,
      ),
    [value],
  );

  const addFromOption = (option: HybridOption) => {
    const meta = getOptionMeta?.(option) ?? {};
    const next: HybridLine = {
      key: makeKey(),
      optionId: option.id,
      label: option.label,
      description: option.description,
      unit: meta.unit ?? "шт",
      quantity: meta.quantity ?? 1,
      expectedQuantity: meta.expectedQuantity,
      costPrice: meta.costPrice ?? 0,
    };
    onChange([...value, next]);
  };

  const updateLine = (key: string, patch: Partial<HybridLine>) => {
    onChange(value.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const removeLine = (key: string) => {
    onChange(value.filter((line) => line.key !== key));
  };

  return (
    <div className={cx(styles.field, className)}>
      {label ? <div className={styles.label}>{label}</div> : null}

      <div className={styles.lines}>
        {value.length > 0 ? (
          <div className={styles.linesTable}>
            <div
              className={cx(
                styles.linesHead,
                showExpected && styles.linesHeadStocktake,
              )}
            >
              <span>Позиция</span>
              {showExpected ? <span>Учёт</span> : null}
              <span>{showExpected ? "Факт" : "Кол-во"}</span>
              {showDiff ? <span>Δ</span> : null}
              {showCost ? <span>Цена</span> : null}
              {showSum ? <span>Сумма</span> : null}
              <span />
            </div>
            {value.map((line) => {
              const diff =
                line.expectedQuantity == null
                  ? null
                  : line.quantity - line.expectedQuantity;
              const sum = line.quantity * (line.costPrice ?? 0);
              return (
                <div
                  key={line.key}
                  className={cx(
                    styles.lineRow,
                    showExpected && styles.lineRowStocktake,
                  )}
                >
                  <div className={styles.lineName}>
                    <div className={styles.lineTitle}>{line.label}</div>
                    {line.description || line.unit ? (
                      <div className={styles.lineDesc}>
                        {[line.description, line.unit].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </div>
                  {showExpected ? (
                    <div className={styles.lineDesc}>
                      {line.expectedQuantity ?? "—"}
                    </div>
                  ) : null}
                  <input
                    className={styles.lineInput}
                    type="number"
                    min={0}
                    disabled={disabled}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.key, {
                        quantity: Number(e.target.value) || 0,
                      })
                    }
                  />
                  {showDiff ? (
                    <span
                      className={cx(
                        diff == null || diff === 0
                          ? styles.diffZero
                          : diff > 0
                            ? styles.diffPos
                            : styles.diffNeg,
                      )}
                    >
                      {diff == null ? "—" : diff > 0 ? `+${diff}` : String(diff)}
                    </span>
                  ) : null}
                  {showCost ? (
                    <input
                      className={styles.lineInput}
                      type="number"
                      min={0}
                      disabled={disabled}
                      value={line.costPrice ?? 0}
                      onChange={(e) =>
                        updateLine(line.key, {
                          costPrice: Number(e.target.value) || 0,
                        })
                      }
                    />
                  ) : null}
                  {showSum ? (
                    <span className={styles.lineSum}>{formatMoney(sum)}</span>
                  ) : null}
                  <button
                    type="button"
                    className={styles.lineRemove}
                    disabled={disabled}
                    onClick={() => removeLine(line.key)}
                    aria-label="Удалить строку"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className={styles.linesAdd}>
          <SearchHybrid
            variant="search"
            options={availableOptions}
            value={null}
            onChange={(opt) => {
              if (opt) addFromOption(opt);
            }}
            placeholder={placeholder}
            disabled={disabled}
            createMode={createMode}
            createLabel={createLabel}
            onCreate={onCreate}
            onCreateRequest={onCreateRequest}
            filter={filter}
            clearable={false}
          />
        </div>

        {value.length > 0 && showSum ? (
          <div className={styles.linesFooter}>
            <span>Итого</span>
            <span className={styles.linesTotal}>{formatMoney(total)}</span>
          </div>
        ) : null}
      </div>

      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </div>
  );
}
