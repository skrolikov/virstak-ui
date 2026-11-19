import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";

import { cx } from "../../lib/cx";

import styles from "../HybridInput.module.css";
import {
  defaultHybridFilter,
  type HybridSearchProps,
} from "../types";
import { usePopoverMenu } from "../usePopoverMenu";

export function SearchHybrid({
  label,
  hint,
  error,
  placeholder = "Поиск…",
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
  clearable = true,
  mode = "chip",
}: HybridSearchProps) {
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inline = mode === "inline";
  const [query, setQuery] = useState(inline ? (value?.label ?? "") : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);
  const coords = usePopoverMenu(open, rootRef);
  const editingRef = useRef(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!inline) return;
    if (editingRef.current) return;
    setQuery(value?.label ?? "");
  }, [inline, value]);

  const filterQuery = dirtyRef.current ? query : "";

  const filtered = useMemo(
    () => options.filter((opt) => filter(opt, filterQuery)),
    [options, filter, filterQuery],
  );

  const trimmed = query.trim();
  const exactMatch = filtered.some(
    (opt) => opt.label.toLowerCase() === trimmed.toLowerCase(),
  );
  const showCreate =
    Boolean(trimmed) &&
    createMode !== "none" &&
    !exactMatch &&
    (createMode === "drawer" || Boolean(onCreate));

  const itemsCount = filtered.length + (showCreate ? 1 : 0);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

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
      editingRef.current = false;
      if (inline) {
        const next = query.trim();
        if (!next) {
          onChange(null);
          setQuery("");
          return;
        }
        if (value && next === value.label) {
          setQuery(value.label);
          return;
        }
        onChange({ id: `draft:inline:${next}`, label: next });
        setQuery(next);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, inline, value, query, onChange]);

  const selectOption = (id: string) => {
    const next = options.find((opt) => opt.id === id) ?? null;
    onChange(next);
    editingRef.current = false;
    dirtyRef.current = false;
    if (inline) {
      setQuery(next?.label ?? "");
    } else {
      setQuery("");
    }
    setOpen(false);
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
      onChange(created);
      editingRef.current = false;
      if (inline) {
        setQuery(created.label);
      } else {
        setQuery("");
      }
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const clear = () => {
    onChange(null);
    setQuery("");
    editingRef.current = false;
    setOpen(false);
  };

  const emitInlineText = (next: string) => {
    editingRef.current = true;
    dirtyRef.current = true;
    setQuery(next);
    setOpen(true);
    if (!next.trim()) {
      onChange(null);
      return;
    }
    if (value && next === value.label) return;
    onChange({ id: `draft:inline:${next}`, label: next });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (itemsCount ? (i + 1) % itemsCount : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((i) =>
        itemsCount ? (i - 1 + itemsCount) % itemsCount : 0,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (showCreate && active === filtered.length) {
        void runCreate();
        return;
      }
      const opt = filtered[active];
      if (opt) selectOption(opt.id);
    } else if (event.key === "Escape") {
      setOpen(false);
      editingRef.current = false;
      if (inline && value) setQuery(value.label);
    } else if (
      event.key === "Backspace" &&
      !inline &&
      !query &&
      value &&
      clearable
    ) {
      onChange(null);
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
          inline && styles.controlInline,
          Boolean(error) && styles.controlError,
          disabled && styles.controlDisabled,
        )}
      >
        {!inline && value && !query ? (
          <span className={styles.valueChip}>
            <span>{value.label}</span>
            {clearable ? (
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => onChange(null)}
                aria-label="Очистить"
              >
                <X size={12} />
              </button>
            ) : null}
          </span>
        ) : null}
        <input
          id={fieldId}
          className={styles.input}
          value={inline ? query : value && !query ? "" : query}
          disabled={disabled}
          placeholder={!inline && value && !query ? "" : placeholder}
          onChange={(e) => {
            if (inline) {
              emitInlineText(e.target.value);
              return;
            }
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            dirtyRef.current = false;
            setOpen(true);
            if (inline) editingRef.current = true;
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
        {clearable &&
        (inline ? Boolean(query || value) : Boolean(value && !query)) ? (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clear}
            aria-label="Очистить"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}

      {open && coords
        ? createPortal(
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
                  role="option"
                  className={cx(
                    styles.option,
                    index === active && styles.optionActive,
                  )}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => selectOption(opt.id)}
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
                      {createLabel?.(trimmed) ??
                        (createMode === "drawer"
                          ? `Создать «${trimmed}»…`
                          : `Создать «${trimmed}»`)}
                    </span>
                  </span>
                </button>
              ) : null}
              {!filtered.length && !showCreate ? (
                <div className={styles.empty}>Ничего не найдено</div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
