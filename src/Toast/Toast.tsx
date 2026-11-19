import { useCallback, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "../Button/Button";
import { cx } from "../lib/cx";
import {
  ToastContext,
  type ToastInput,
  type ToastTone,
} from "./toast-context";

import styles from "./Toast.module.css";

type ToastItem = ToastInput & { id: string };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID();
      const durationMs = toast.durationMs ?? 3500;
      setItems((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.viewport} aria-live="polite">
          {items.map((item) => (
            <div
              key={item.id}
              className={cx(
                styles.toast,
                styles[(item.tone ?? "neutral") as ToastTone],
              )}
              role="status"
            >
              <div className={styles.content}>
                <div className={styles.title}>{item.title}</div>
                {item.description ? (
                  <div className={styles.description}>{item.description}</div>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Закрыть уведомление"
                onClick={() => dismiss(item.id)}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
