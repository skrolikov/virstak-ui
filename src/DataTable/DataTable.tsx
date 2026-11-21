import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type UIEvent,
} from "react";

import { cx } from "../lib/cx";
import { matchesQuery as defaultMatchesQuery } from "../lib/matches-query";
import { EmptyState } from "../EmptyState/EmptyState";
import { pendingRecordsLabel } from "../virtual/pending-label";
import {
  anchoredScrollTop,
  captureAnchor,
  type ScrollAnchor,
} from "../virtual/scroll-anchor";

import styles from "./DataTable.module.css";

export type DataTableViewport = {
  atHead: boolean;
  from: number;
  to: number;
  count: number;
};

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  /** @deprecated Список виртуализируется целиком. Значение не используется. */
  pageSize?: number | null;
  /** Kept for existing tables. Search is shown unless `searchable` is false. */
  filterColumn?: string;
  /** Placeholder for the global filter input. */
  filterPlaceholder?: string;
  /** Set false to hide the search field. */
  searchable?: boolean;
  /** Controlled filter value. */
  globalFilter?: string;
  /** Callback when filter changes. */
  onFilterChange?: (value: string) => void;
  /** Click handler for the whole row. */
  onRowClick?: (row: TData) => void;
  /** @deprecated Таблица всегда занимает высоту родителя. */
  fitRows?: boolean;
  /** Override global text search. Default walks primitive fields of the row. */
  matchesQuery?: (value: unknown, query: string) => boolean;
  /** Stable row identity. Defaults to `id` when the row has one. */
  getRowId?: (row: TData, index: number) => string;
  estimateSize?: number;
  /** Вызывается заранее, когда низ списка входит в зону просмотра. */
  onEndReached?: () => void;
  /** Новые записи, которые не вставлены, пока пользователь не у начала списка. */
  pendingCount?: number;
  onRevealPending?: () => void;
  pendingLabel?: (count: number) => string;
  onViewportChange?: (viewport: DataTableViewport) => void;
};

const WINDOW_AFTER = 12;

function defaultRowId<TData>(row: TData, index: number): string {
  if (row && typeof row === "object" && "id" in row && row.id != null) {
    return String((row as { id: string | number }).id);
  }
  return String(index);
}

export function DataTable<TData>({
  columns,
  data,
  emptyTitle = "Нет данных",
  emptyDescription = "Когда появятся записи, они отобразятся здесь.",
  className,
  filterPlaceholder = "Поиск…",
  searchable = true,
  globalFilter: controlledFilter,
  onFilterChange,
  onRowClick,
  matchesQuery = defaultMatchesQuery,
  getRowId,
  estimateSize = 64,
  onEndReached,
  pendingCount = 0,
  onRevealPending,
  pendingLabel = pendingRecordsLabel,
  onViewportChange,
}: DataTableProps<TData>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<ScrollAnchor | null>(null);
  const stickToHead = useRef(true);
  const endReachedRef = useRef(onEndReached);
  endReachedRef.current = onEndReached;
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filtering, setFiltering] = useState("");

  const isControlled = controlledFilter !== undefined;
  const effectiveFilter = controlledFilter ?? filtering;
  const handleFilterChange = useCallback(
    (value: string) => {
      if (!isControlled) setFiltering(value);
      onFilterChange?.(value);
    },
    [isControlled, onFilterChange],
  );

  const resolveRowId = useCallback(
    (row: TData, index: number) => (getRowId ? getRowId(row, index) : defaultRowId(row, index)),
    [getRowId],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: effectiveFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: handleFilterChange,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      matchesQuery(row.original, String(filterValue ?? "")),
    getRowId: (original, index) => resolveRowId(original, index),
  });

  const rows = table.getRowModel().rows;
  const windowed = rows.length > WINDOW_AFTER;
  const virtualizer = useVirtualizer({
    count: windowed ? rows.length : 0,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => estimateSize,
    overscan: 8,
    initialRect: { width: 800, height: 640 },
    getItemKey: (index) => rows[index]?.id ?? index,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const structure = rows.map((row) => row.id).join("\0");
  const sortingKey = sorting.map((column) => `${column.id}:${column.desc ? 1 : 0}`).join("|");

  const publish = useCallback(
    (atHead: boolean) => {
      const visible = windowed ? virtualizer.getVirtualItems() : [];
      const from = windowed
        ? visible[0]
          ? visible[0].index + 1
          : 0
        : rows.length
          ? 1
          : 0;
      const to = windowed
        ? visible.length
          ? visible[visible.length - 1].index + 1
          : 0
        : rows.length;
      onViewportChangeRef.current?.({ atHead, from, to, count: rows.length });
    },
    [rows.length, virtualizer, windowed],
  );

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    stickToHead.current = scrollTop < 8;
    const visible = virtualizer.getVirtualItems();
    const anchor = captureAnchor(
      scrollTop,
      visible.map((row) => ({
        key: String(row.key),
        start: row.start,
        end: row.end,
      })),
    );
    if (anchor) anchorRef.current = { ...anchor, atHead: stickToHead.current };
    publish(stickToHead.current);
  };

  useLayoutEffect(() => {
    stickToHead.current = true;
    anchorRef.current = anchorRef.current
      ? { ...anchorRef.current, atHead: true }
      : null;
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [sortingKey, effectiveFilter]);

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (!element || !windowed) return;
    if (stickToHead.current) {
      if (element.scrollTop !== 0) element.scrollTop = 0;
      return;
    }
    const next = anchoredScrollTop(anchorRef.current, (key) => {
      const index = rows.findIndex((row) => row.id === key);
      if (index < 0) return null;
      return virtualizer.getOffsetForIndex(index, "start")?.[0] ?? null;
    });
    if (next == null) return;
    if (Math.abs(element.scrollTop - next) > 1) element.scrollTop = next;
  }, [structure, windowed]);

  useEffect(() => {
    const node = endRef.current;
    const root = scrollerRef.current;
    if (!node || !root || !windowed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) endReachedRef.current?.();
      },
      { root, rootMargin: "280px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [windowed, structure]);

  useEffect(() => {
    publish(stickToHead.current);
  }, [publish, structure]);

  const reveal = () => {
    stickToHead.current = true;
    anchorRef.current = { key: "", offset: 0, atHead: true };
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    onRevealPending?.();
  };

  const filteredCount = rows.length;
  const virtualReady = windowed && virtualItems.length > 0;
  const shownFrom = virtualReady
    ? (virtualItems[0]?.index ?? 0) + 1
    : filteredCount
      ? 1
      : 0;
  const shownTo = virtualReady
    ? (virtualItems[virtualItems.length - 1]?.index ?? 0) + 1
    : filteredCount;
  const windowLabel =
    filteredCount === 0
      ? "0"
      : windowed && shownFrom > 0
        ? `${shownFrom.toLocaleString("ru-RU")}–${shownTo.toLocaleString("ru-RU")} / ${filteredCount.toLocaleString("ru-RU")}`
        : effectiveFilter.trim()
          ? `${filteredCount.toLocaleString("ru-RU")} из ${data.length.toLocaleString("ru-RU")}`
          : filteredCount.toLocaleString("ru-RU");

  if (data.length === 0) {
    return (
      <div className={cx(styles.wrap, className)}>
        <div className={styles.empty}>
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      </div>
    );
  }

  const paddingTop = virtualReady ? (virtualItems[0]?.start ?? 0) : 0;
  const lastVirtual = virtualItems[virtualItems.length - 1];
  const paddingBottom = virtualReady && lastVirtual
    ? virtualizer.getTotalSize() - lastVirtual.end
    : 0;
  const columnCount = table.getAllColumns().length;
  const rendered = windowed
    ? virtualItems.length > 0
      ? virtualItems.flatMap((virtualRow) => {
          const row = rows[virtualRow.index];
          return row ? [row] : [];
        })
      : rows.slice(0, 16)
    : rows;

  return (
    <div ref={wrapRef} className={cx(styles.wrap, className)}>
      {(searchable || windowed) && (
        <div className={styles.toolbar} data-table-toolbar="">
          {searchable && (
            <div className={styles.filter}>
            <svg
              className={styles.filterIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className={styles.filterInput}
              placeholder={filterPlaceholder}
              value={effectiveFilter}
              onChange={(event) => handleFilterChange(event.target.value)}
              aria-label={filterPlaceholder}
              />
            </div>
          )}
          <div className={styles.paginationInfo}>{windowLabel}</div>
        </div>
      )}
      <div
        ref={scrollerRef}
        className={styles.scroller}
        onScroll={handleScroll}
      >
        {pendingCount > 0 && (
          <div className={styles.reveal}>
            <button type="button" className={styles.revealBtn} onClick={reveal}>
              {pendingLabel(pendingCount)}
            </button>
          </div>
        )}
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      className={cx(styles.headCell, canSort && styles.sortable)}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc"
                        ? " ↑"
                        : header.column.getIsSorted() === "desc"
                          ? " ↓"
                          : null}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className={styles.noResults}>
                  <EmptyState
                    title="Ничего не найдено"
                    description="Попробуйте изменить параметры поиска."
                  />
                </td>
              </tr>
            ) : (
              <>
                {paddingTop > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={columnCount}
                      className={styles.padCell}
                      style={{ height: paddingTop }}
                    />
                  </tr>
                )}
                {rendered.map((row) => (
                  <tr
                    key={row.id}
                    data-index={row.index}
                    ref={virtualReady ? virtualizer.measureElement : undefined}
                    className={cx(styles.row, onRowClick && styles.rowClickable)}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={styles.cell}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {paddingBottom > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={columnCount}
                      className={styles.padCell}
                      style={{ height: paddingBottom }}
                    />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
        <div ref={endRef} className={styles.sentinel} />
      </div>
    </div>
  );
}

export { getCoreRowModel, getSortedRowModel, getPaginationRowModel };
