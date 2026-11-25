import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { cx } from "../lib/cx";
import { pendingRecordsLabel } from "./pending-label";
import { anchoredScrollTop, captureAnchor, type ScrollAnchor } from "./scroll-anchor";

import styles from "./VirtualList.module.css";

export type VirtualListViewport = {
  atHead: boolean;
  from: number;
  to: number;
  count: number;
};

export type VirtualListProps<T> = {
  items: readonly T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  gap?: number;
  /** Plain lists use the available height and omit the range header and frame. */
  variant?: "default" | "plain";
  className?: string;
  onEndReached?: () => void;
  pendingCount?: number;
  onRevealPending?: () => void;
  pendingLabel?: (count: number) => string;
  empty?: ReactNode;
  onViewportChange?: (viewport: VirtualListViewport) => void;
};

const WINDOW_AFTER = 12;

export function VirtualList<T>({
  items,
  getKey,
  renderItem,
  estimateSize = 64,
  gap = 0,
  variant = "default",
  className,
  onEndReached,
  pendingCount = 0,
  onRevealPending,
  pendingLabel = pendingRecordsLabel,
  empty,
  onViewportChange,
}: VirtualListProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<ScrollAnchor | null>(null);
  const endReachedRef = useRef(onEndReached);
  endReachedRef.current = onEndReached;
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const plain = variant === "plain";
  const observeEnd = onEndReached != null;
  const windowed = items.length > WINDOW_AFTER;
  const virtualizer = useVirtualizer({
    count: windowed ? items.length : 0,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => estimateSize,
    gap,
    overscan: 8,
    initialRect: { width: 800, height: 640 },
    getItemKey: (index) => getKey(items[index], index),
  });

  const virtualItems = virtualizer.getVirtualItems();
  const [range, setRange] = useState({ from: 0, to: 0 });

  const structure = items.map(getKey).join("\0");

  const publish = useCallback(
    (atHead: boolean, from: number, to: number) => {
      setRange((current) =>
        current.from === from && current.to === to ? current : { from, to },
      );
      onViewportChangeRef.current?.({
        atHead,
        from,
        to,
        count: items.length,
      });
    },
    [items.length],
  );

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const rows = (windowed ? virtualizer.getVirtualItems() : []).map((row) => ({
      key: String(row.key),
      start: row.start,
      end: row.end,
    }));
    const anchor = captureAnchor(event.currentTarget.scrollTop, rows);
    if (anchor) anchorRef.current = anchor;
    const visible = virtualizer.getVirtualItems();
    const from = visible[0] ? visible[0].index + 1 : items.length ? 1 : 0;
    const to = visible.length ? visible[visible.length - 1].index + 1 : items.length;
    publish(event.currentTarget.scrollTop < 8, from, to);
  };

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (!element || !windowed) return;
    if (anchorRef.current?.atHead) {
      if (element.scrollTop !== 0) element.scrollTop = 0;
      return;
    }
    const next = anchoredScrollTop(anchorRef.current, (key) => {
      const index = items.findIndex((item, index) => getKey(item, index) === key);
      if (index < 0) return null;
      const offset = virtualizer.getOffsetForIndex(index, "start");
      return offset ? offset[0] : null;
    });
    if (next == null) return;
    if (Math.abs(element.scrollTop - next) > 1) element.scrollTop = next;
  }, [structure, windowed]);

  useEffect(() => {
    const node = endRef.current;
    const root = scrollerRef.current;
    if (!observeEnd || !node || !root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) endReachedRef.current?.();
      },
      { root, rootMargin: "280px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [observeEnd, plain, structure, windowed]);

  useEffect(() => {
    if (windowed) return;
    publish(true, items.length ? 1 : 0, items.length);
  }, [windowed, items.length, publish]);

  const reveal = () => {
    anchorRef.current = { key: "", offset: 0, atHead: true };
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    onRevealPending?.();
  };

  if (items.length === 0 && empty) {
    return <div className={cx(styles.empty, className)}>{empty}</div>;
  }

  const scroller = (
    <div
      ref={scrollerRef}
      className={cx(
        styles.scroller,
        !plain && windowed && styles.scrollerWindow,
        plain && className,
      )}
      onScroll={handleScroll}
    >
      {pendingCount > 0 && (
        <div className={styles.reveal}>
          <button type="button" className={styles.revealBtn} onClick={reveal}>
            {pendingLabel(pendingCount)}
          </button>
        </div>
      )}
      <div
        className={cx(styles.inner, !windowed && gap > 0 && styles.spaced)}
        style={windowed ? { height: virtualizer.getTotalSize() } : { gap }}
      >
        {windowed
          ? virtualItems.map((virtualRow) => (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className={styles.row}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                {renderItem(items[virtualRow.index], virtualRow.index)}
              </div>
            ))
          : items.map((item, index) => (
              <div key={getKey(item, index)} className={styles.rowStatic}>
                {renderItem(item, index)}
              </div>
            ))}
      </div>
      {observeEnd && <div ref={endRef} className={styles.sentinel} />}
    </div>
  );

  if (plain) return scroller;

  const shownFrom = windowed ? range.from || (virtualItems[0]?.index ?? 0) + 1 : 1;
  const shownTo = windowed
    ? range.to || (virtualItems.length ? virtualItems[virtualItems.length - 1].index + 1 : 0)
    : items.length;

  return (
    <div className={cx(styles.wrap, className)}>
      <div className={styles.meta}>
        {items.length === 0
          ? "0"
          : `${shownFrom.toLocaleString("ru-RU")}–${shownTo.toLocaleString("ru-RU")} / ${items.length.toLocaleString("ru-RU")}`}
      </div>
      {scroller}
    </div>
  );
}
