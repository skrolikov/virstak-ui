export type AnchorRow = {
  key: string;
  start: number;
  end: number;
};

export type ScrollAnchor = {
  key: string;
  offset: number;
  atHead: boolean;
};

const HEAD_THRESHOLD = 8;

export function captureAnchor(
  scrollTop: number,
  rows: readonly AnchorRow[],
): ScrollAnchor | null {
  const first = rows.find((row) => row.end > scrollTop + 1) ?? rows[0];
  if (!first) return null;
  return {
    key: first.key,
    offset: first.start - scrollTop,
    atHead: scrollTop < HEAD_THRESHOLD,
  };
}

/** Смещение, которое удерживает якорную строку на месте. null — остаёмся у головы списка. */
export function anchoredScrollTop(
  anchor: ScrollAnchor | null,
  findStart: (key: string) => number | null,
): number | null {
  if (!anchor || anchor.atHead) return null;
  const start = findStart(anchor.key);
  if (start == null) return null;
  return Math.max(0, start - anchor.offset);
}
