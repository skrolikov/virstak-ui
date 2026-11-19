import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cx } from "../lib/cx";

import styles from "./Dropdown.module.css";

export type DropdownItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onSelect?: () => void;
};

export type DropdownAlign = "start" | "end";

export type DropdownProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  className?: string;
  align?: DropdownAlign;
};

type MenuCoords = {
  top: number;
  left: number;
  minWidth: number;
};

export function Dropdown({
  trigger,
  items,
  className,
  align = "start",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const updatePosition = useCallback(() => {
    const triggerEl = rootRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const menuWidth = Math.max(
      rect.width,
      menuRef.current?.offsetWidth ?? 180,
      180,
    );
    const gap = 8;
    const viewportPadding = 8;

    let left = align === "end" ? rect.right - menuWidth : rect.left;

    left = Math.min(
      Math.max(left, viewportPadding),
      window.innerWidth - menuWidth - viewportPadding,
    );

    let top = rect.bottom + gap;
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    if (
      menuHeight > 0 &&
      top + menuHeight > window.innerHeight - viewportPadding
    ) {
      top = Math.max(viewportPadding, rect.top - gap - menuHeight);
    }

    setCoords({
      top,
      left,
      minWidth: Math.max(rect.width, 180),
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, items.length, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const menuStyle: CSSProperties | undefined = coords
    ? {
        top: coords.top,
        left: coords.left,
        minWidth: coords.minWidth,
      }
    : undefined;

  return (
    <div className={cx(styles.root, className)} ref={rootRef}>
      <div
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        {trigger}
      </div>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className={styles.menu}
              role="menu"
              id={menuId}
              style={menuStyle}
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={cx(styles.item, item.danger && styles.itemDanger)}
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
