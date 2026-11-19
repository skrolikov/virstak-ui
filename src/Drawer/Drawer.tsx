import {
  useCallback,
  useId,
  useRef,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { X } from "lucide-react";

import { Button } from "../Button/Button";
import { cx } from "../lib/cx";
import { OverlayPortal } from "../overlay/OverlayPortal";
import { useEscapeLayer } from "../overlay/useEscapeLayer";
import { useFocusTrap } from "../overlay/useFocusTrap";
import { useScrollLock } from "../overlay/useScrollLock";

import styles from "./Drawer.module.css";

export type DrawerSide = "left" | "right";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: DrawerSide;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  side = "right",
  children,
  footer,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const close = useCallback(() => onClose(), [onClose]);

  useScrollLock(open);
  useEscapeLayer(open, close);
  useFocusTrap(open, panelRef);

  if (!open) return null;

  const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <OverlayPortal>
      <div
        className={styles.overlay}
        role="presentation"
        onClick={handleOverlayClick}
      />
      <aside
        ref={panelRef}
        className={cx(styles.panel, styles[side], className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </div>
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </aside>
    </OverlayPortal>
  );
}
