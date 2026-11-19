import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { cx } from "../lib/cx";
import { matchesQuery as defaultMatchesQuery } from "../lib/matches-query";
import { EmptyState } from "../EmptyState/EmptyState";

import styles from "./DataTable.module.css";

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  /** Initial number of rows per page (default 10). Pass null for unlimited. */
  pageSize?: number;
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
  /** Page size follows the free height, so the list does not scroll. */
  fitRows?: boolean;
  /** Override global text search. Default walks primitive fields of the row. */
  matchesQuery?: (value: unknown, query: string) => boolean;
};

export function DataTable<TData>({
  columns,
  data,
  emptyTitle = "Нет данных",
  emptyDescription = "Когда появятся записи, они отобразятся здесь.",
  className,
  pageSize = 10,
  filterPlaceholder = "Поиск…",
  searchable = true,
  globalFilter: controlledFilter,
  onFilterChange,
  onRowClick,
  fitRows = false,
  matchesQuery = defaultMatchesQuery,
}: DataTableProps<TData>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filtering, setFiltering] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize ?? 10,
  });

  const isControlled = controlledFilter !== undefined;
  const effectiveFilter = controlledFilter ?? filtering;
  const handleFilterChange = useCallback(
    (value: string) => {
      if (!isControlled) setFiltering(value);
      onFilterChange?.(value);
      setPagination((current) =>
        current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
      );
    },
    [isControlled, onFilterChange],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: effectiveFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: handleFilterChange,
    onPaginationChange: setPagination,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: pageSize != null ? getPaginationRowModel() : undefined,
    globalFilterFn: (row, _columnId, filterValue) =>
      matchesQuery(row.original, String(filterValue ?? "")),
    manualPagination: false,
    manualFiltering: false,
  });

  useLayoutEffect(() => {
    if (!fitRows) return;
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const header = el.querySelector("thead")?.getBoundingClientRect().height ?? 42;
      const footer = el.querySelector("[data-table-footer]")?.getBoundingClientRect().height ?? 0;
      const toolbar =
        el.querySelector("[data-table-toolbar]")?.getBoundingClientRect().height ?? 0;
      const row = el.querySelector("tbody tr")?.getBoundingClientRect().height ?? 72;
      const available = el.clientHeight - header - footer - toolbar;
      const next = Math.max(1, Math.floor(available / Math.max(row, 1)));
      setPagination((current) => {
        const pageCount = Math.max(1, Math.ceil(data.length / next));
        const pageIndex = Math.min(current.pageIndex, pageCount - 1);
        if (current.pageSize === next && current.pageIndex === pageIndex) return current;
        return { pageSize: next, pageIndex };
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitRows, data.length]);

  const hasFilter = searchable;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const hasPagination =
    pageSize != null && table.getFilteredRowModel().rows.length > pagination.pageSize;

  if (data.length === 0) {
    return (
      <div className={cx(styles.empty, className)}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={cx(styles.wrap, fitRows && styles.wrapFit, className)}>
      {hasFilter && (
        <div className={styles.toolbar} data-table-toolbar="">
          {hasFilter && (
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
                onChange={(e) => handleFilterChange(e.target.value)}
                aria-label={filterPlaceholder}
              />
            </div>
          )}
          <div className={styles.paginationInfo}>
            {effectiveFilter.trim()
              ? `${filteredCount} из ${data.length}`
              : data.length}
          </div>
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
                    className={cx(
                      styles.headCell,
                      canSort && styles.sortable,
                    )}
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={table.getAllColumns().length}
                className={styles.noResults}
              >
                <EmptyState
                  title="Ничего не найдено"
                  description="Попробуйте изменить параметры поиска."
                />
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cx(styles.row, onRowClick && styles.rowClickable)}
                onClick={
                  onRowClick
                    ? () => onRowClick(row.original)
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={styles.cell}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {hasPagination && (
        <div className={styles.footer} data-table-footer="">
          <div className={styles.pageInfo}>
            Страница {table.getState().pagination.pageIndex + 1} из{" "}
            {table.getPageCount()}
          </div>
          <div className={styles.pageActions}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={!table.getCanPreviousPage()}
              onClick={() => void table.setPageIndex(0)}
              title="Первая страница"
            >
              «
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={!table.getCanPreviousPage()}
              onClick={() => void table.previousPage()}
              title="Предыдущая страница"
            >
              ‹
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={!table.getCanNextPage()}
              onClick={() => void table.nextPage()}
              title="Следующая страница"
            >
              ›
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={!table.getCanNextPage()}
              onClick={() => void table.setPageIndex(table.getPageCount() - 1)}
              title="Последняя страница"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export commonly used helpers so consumers don't need to import from tanstack directly
export { getCoreRowModel, getSortedRowModel, getPaginationRowModel };
