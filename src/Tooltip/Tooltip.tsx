import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { cx } from "../lib/cx";
import { OverlayPortal } from "../overlay/OverlayPortal";

import styles from "./Tooltip.module.css";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
};

export function Tooltip({
  content,
  children,
  className,
  side = "right",
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const trigger = triggerRef.current;
      const tip = tipRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const tipWidth = tip?.offsetWidth ?? 120;
      const tipHeight = tip?.offsetHeight ?? 28;
      const gap = 8;

      let top = rect.top;
      let left = rect.right + gap;

      if (side === "top") {
        top = rect.top - tipHeight - gap;
        left = rect.left + rect.width / 2 - tipWidth / 2;
      } else if (side === "bottom") {
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tipWidth / 2;
      } else if (side === "left") {
        top = rect.top + rect.height / 2 - tipHeight / 2;
        left = rect.left - tipWidth - gap;
      } else {
        top = rect.top + rect.height / 2 - tipHeight / 2;
        left = rect.right + gap;
      }

      const pad = 8;
      left = Math.min(Math.max(pad, left), window.innerWidth - tipWidth - pad);
      top = Math.min(Math.max(pad, top), window.innerHeight - tipHeight - pad);

      setCoords({ top, left });
    };

    update();
    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, side, content]);

  const style: CSSProperties = {
    top: coords.top,
    left: coords.left,
  };

  const describedBy = open ? tipId : undefined;
  const trigger = isValidElement(children)
    ? cloneElement(
        children as ReactElement<HTMLAttributes<HTMLElement>>,
        {
          "aria-describedby": [
            (children.props as HTMLAttributes<HTMLElement>)["aria-describedby"],
            describedBy,
          ]
            .filter(Boolean)
            .join(" ") || undefined,
        },
      )
    : children;

  return (
    <span
      ref={triggerRef}
      className={cx(styles.root, className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {trigger}
      {open ? (
        <OverlayPortal>
          <span
            ref={tipRef}
            id={tipId}
            role="tooltip"
            className={cx(styles.tooltip, styles.visible)}
            style={style}
          >
            {content}
          </span>
        </OverlayPortal>
      ) : null}
    </span>
  );
}
