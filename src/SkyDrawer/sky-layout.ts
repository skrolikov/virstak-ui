import type { SkyDrawerPanel } from "./types";

/** Keep in sync with --sky-move in SkyDrawer.module.css */
export const SKY_MOVE_MS = 220;

const PEEK = 46;
const PEEK_MIN = 32;
const GAP = 8;
const EDGE = 12;
const STAGE_FRAME = 56;

export type SkyBox = {
  width: number;
  right: number;
  /** Content width. Stays put while the shell folds so text does not reflow. */
  rest: number;
  folded: boolean;
  /** Phone: parked under the front panel instead of a side spine. */
  parked: boolean;
  stage: boolean;
  /** Match the near-fullscreen vertical frame (spines included). */
  alignStage: boolean;
};

/** Opened pin wins. Otherwise the last panel that is not pinned. */
export function frontIndexOf(
  panels: { id: string }[],
  pinnedIds: readonly string[],
  openedPinId: string | null,
) {
  if (openedPinId) {
    const opened = panels.findIndex((panel) => panel.id === openedPinId);
    if (opened >= 0) return opened;
  }
  const pinned = new Set(pinnedIds);
  for (let index = panels.length - 1; index >= 0; index -= 1) {
    if (!pinned.has(panels[index].id)) return index;
  }
  return -1;
}

export function layoutStack(
  panels: SkyDrawerPanel[],
  viewport: number,
  frontIndex = panels.length - 1,
): SkyBox[] {
  if (panels.length === 0) return [];
  if (frontIndex < 0) return layoutDock(panels, viewport);

  const visual = panels.filter((_, index) => index !== frontIndex);
  visual.push(panels[frontIndex]);
  const boxes = layoutVisual(visual, viewport);
  const byId = new Map(visual.map((panel, index) => [panel.id, boxes[index]]));
  return panels.map((panel) => byId.get(panel.id) ?? boxes[0]);
}

function layoutDock(panels: SkyDrawerPanel[], viewport: number): SkyBox[] {
  const compact = viewport < 768;
  const peek = compact ? 42 : PEEK;
  const edge = compact ? 8 : EDGE;
  return panels.map((panel, index) => ({
    width: peek,
    right: edge + (panels.length - 1 - index) * (peek + GAP),
    rest: Math.min(panel.width, Math.max(280, viewport - 24)),
    folded: true,
    parked: false,
    stage: false,
    alignStage: false,
  }));
}

function layoutVisual(panels: SkyDrawerPanel[], viewport: number): SkyBox[] {
  const count = panels.length;
  const compact = viewport < 768;
  const top = panels[count - 1];
  const frame = viewport < 900 ? 8 : STAGE_FRAME;

  if (compact) {
    const width = Math.max(280, viewport - 16);
    return panels.map((panel, index) => {
      const isTop = index === count - 1;
      return {
        width,
        right: 8,
        rest: width,
        folded: !isTop,
        parked: !isTop,
        stage: Boolean(panel.stage && isTop),
        alignStage: Boolean(top.stage),
      };
    });
  }

  const peek = fitPeek(count - 1, Boolean(top.stage), top.width, viewport, frame);
  const topPlace = placePanel(top, count - 1, peek, viewport, frame);

  return panels.map((panel, index) => {
    const isTop = index === count - 1;
    const own = placePanel(panel, index, peek, viewport, frame);
    if (isTop) {
      return {
        width: topPlace.width,
        right: topPlace.right,
        rest: topPlace.width,
        folded: false,
        parked: false,
        stage: Boolean(panel.stage),
        alignStage: Boolean(panel.stage),
      };
    }

    const depth = count - 1 - index;
    return {
      width: peek,
      right:
        topPlace.right + topPlace.width + GAP + (depth - 1) * (peek + GAP),
      rest: own.width,
      folded: true,
      parked: false,
      stage: false,
      alignStage: Boolean(top.stage),
    };
  });
}

function fitPeek(
  older: number,
  stage: boolean,
  wanted: number,
  viewport: number,
  frame: number,
) {
  if (older <= 0) return PEEK;
  const side = stage ? frame + EDGE : EDGE * 2;
  const minTop = Math.min(wanted, stage ? viewport - frame * 2 : 360);
  const available = viewport - side - Math.max(280, minTop);
  const needed = older * (PEEK + GAP);
  if (needed <= available) return PEEK;
  return Math.max(PEEK_MIN, Math.floor(available / older - GAP));
}

function placePanel(
  panel: SkyDrawerPanel,
  older: number,
  peek: number,
  viewport: number,
  frame: number,
) {
  const reserve = older > 0 ? older * (peek + GAP) : 0;

  if (panel.stage) {
    const right = frame;
    const leftInset = older > 0 ? EDGE + reserve : frame;
    return {
      width: Math.max(300, viewport - right - leftInset),
      right,
    };
  }

  const right = EDGE;
  const width = Math.min(
    panel.width,
    Math.max(280, viewport - EDGE - right - reserve),
  );
  return { width, right };
}
