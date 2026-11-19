import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Plus, X } from "lucide-react";

import { cx } from "../../lib/cx";
import { OverlayPortal } from "../../overlay/OverlayPortal";

import styles from "../HybridInput.module.css";
import {
  defaultHybridFilter,
  type HybridTagsProps,
} from "../types";
import { usePopoverMenu } from "../usePopoverMenu";

export function TagsHybrid({
  label,
  hint,
  error,
  placeholder = "Добавить…",
  disabled,
  className,
  createMode = "none",
  createLabel,
  onCreate,
  onCreateRequest,
  options,
  value,
  onChange,
  filter = defaultHybridFilter,
}: HybridTagsProps) {
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);
  const coords = usePopoverMenu(open, rootRef);

  const selectedIds = useMemo(
    () => new Set(value.map((item) => item.id)),
    [value],
  );

  const filtered = useMemo(
    () =>
      options.filter(
        (opt) => !selectedIds.has(opt.id) && filter(opt, query),
      ),
    [options, selectedIds, filter, query],
  );

  const trimmed = query.trim();
  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === trimmed.toLowerCase(),
  );
  const showCreate =
    Boolean(trimmed) &&
    createMode !== "none" &&
    !exactMatch &&
    (createMode === "drawer" || Boolean(onCreate));
  const itemsCount = filtered.length + (showCreate ? 1 : 0);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const addOption = (opt: (typeof options)[number]) => {
    if (selectedIds.has(opt.id)) return;
    onChange([...value, opt]);
    setQuery("");
    setOpen(true);
  };

  const removeOption = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const runCreate = async () => {
    if (!trimmed || creating) return;
    if (createMode === "drawer") {
      onCreateRequest?.(trimmed);
      setOpen(false);
      return;
    }
    if (!onCreate) return;
    setCreating(true);
    try {
      const created = await onCreate(trimmed);
      addOption(created);
    } finally {
      setCreating(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (itemsCount ? (i + 1) % itemsCount : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) =>
        itemsCount ? (i - 1 + itemsCount) % itemsCount : 0,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (showCreate && active === filtered.length) {
        void runCreate();
        return;
      }
      const opt = filtered[active];
      if (opt) addOption(opt);
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Backspace" && !query && value.length) {
      removeOption(value[value.length - 1].id);
    }
  };

  return (
    <div className={cx(styles.field, className)}>
      {label ? (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <div
        ref={rootRef}
        className={cx(
          styles.control,
          Boolean(error) && styles.controlError,
          disabled && styles.controlDisabled,
        )}
      >
        <div className={styles.tags}>
          {value.map((item) => (
            <span key={item.id} className={styles.tag}>
              <span className={styles.tagLabel}>{item.label}</span>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => removeOption(item.id)}
                aria-label={`Удалить ${item.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <input
          id={fieldId}
          className={styles.input}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
      </div>
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}

      {open && coords ? (
        <OverlayPortal>
          <div
            ref={menuRef}
            className={styles.menu}
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
            role="listbox"
          >
              {filtered.map((opt, index) => (
                <button
                  key={opt.id}
                  type="button"
                  className={cx(
                    styles.option,
                    index === active && styles.optionActive,
                  )}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => addOption(opt)}
                >
                  <span className={styles.optionLabel}>
                    <span>{opt.label}</span>
                    {opt.meta}
                  </span>
                  {opt.description ? (
                    <span className={styles.optionDesc}>{opt.description}</span>
                  ) : null}
                </button>
              ))}
              {showCreate ? (
                <button
                  type="button"
                  className={cx(
                    styles.option,
                    styles.optionCreate,
                    active === filtered.length && styles.optionActive,
                  )}
                  onMouseEnter={() => setActive(filtered.length)}
                  onClick={() => void runCreate()}
                  disabled={creating}
                >
                  <span className={styles.optionLabel}>
                    <span>
                      <Plus size={14} style={{ marginRight: 6 }} />
                      {createLabel?.(trimmed) ?? `Создать «${trimmed}»`}
                    </span>
                  </span>
                </button>
              ) : null}
              {!filtered.length && !showCreate ? (
                <div className={styles.empty}>Ничего не найдено</div>
              ) : null}
          </div>
        </OverlayPortal>
      ) : null}
    </div>
  );
}
