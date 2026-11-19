import { niceMax } from "./utils";

export type ChartPoint = {
  index: number;
  value: number;
  label?: string;
  x: number;
  y: number;
};

export type LineLayout = {
  points: ChartPoint[];
  max: number;
  padX: number;
  padTop: number;
  padBottom: number;
  chartW: number;
  chartH: number;
};

export type BarLayout = {
  bars: Array<ChartPoint & { width: number; height: number }>;
  max: number;
  padX: number;
  padTop: number;
  padBottom: number;
  chartH: number;
};

export function layoutLinePoints(
  values: number[],
  labels: string[],
  width: number,
  height: number,
  pads: { padX: number; padTop: number; padBottom: number },
): LineLayout {
  const { padX, padTop, padBottom } = pads;
  const chartW = Math.max(width - padX * 2, 1);
  const chartH = Math.max(height - padTop - padBottom, 1);
  const max = niceMax(Math.max(...values, 0));
  const step = values.length > 1 ? chartW / (values.length - 1) : 0;

  const points = values.map((value, index) => ({
    index,
    value,
    label: labels[index],
    x: padX + index * step,
    y: padTop + chartH - (value / max) * chartH,
  }));

  return { points, max, padX, padTop, padBottom, chartW, chartH };
}

export function layoutBars(
  values: number[],
  labels: string[],
  width: number,
  height: number,
  pads: { padX: number; padTop: number; padBottom: number },
  gap = 6,
): BarLayout {
  const { padX, padTop, padBottom } = pads;
  const chartW = Math.max(width - padX * 2, 1);
  const chartH = Math.max(height - padTop - padBottom, 1);
  const max = niceMax(Math.max(...values, 0));
  const barW = Math.max(
    4,
    (chartW - gap * Math.max(values.length - 1, 0)) / Math.max(values.length, 1),
  );

  const bars = values.map((value, index) => {
    const h = (value / max) * chartH;
    const x = padX + index * (barW + gap);
    const y = padTop + chartH - h;
    return {
      index,
      value,
      label: labels[index],
      x,
      y,
      width: barW,
      height: h,
    };
  });

  return { bars, max, padX, padTop, padBottom, chartH };
}

export function nearestPoint(
  points: ChartPoint[],
  pointerX: number,
): ChartPoint | null {
  if (points.length === 0) return null;
  let best = points[0];
  let bestDist = Math.abs(points[0].x - pointerX);
  for (let i = 1; i < points.length; i += 1) {
    const dist = Math.abs(points[i].x - pointerX);
    if (dist < bestDist) {
      best = points[i];
      bestDist = dist;
    }
  }
  return best;
}

export function hitTestBar(
  bars: Array<ChartPoint & { width: number; height: number }>,
  pointerX: number,
  pointerY: number,
): (ChartPoint & { width: number; height: number }) | null {
  for (const bar of bars) {
    if (
      pointerX >= bar.x &&
      pointerX <= bar.x + bar.width &&
      pointerY >= bar.y &&
      pointerY <= bar.y + bar.height
    ) {
      return bar;
    }
  }

  // Fallback: nearest bar by X for easier hover
  if (bars.length === 0) return null;
  let best = bars[0];
  let bestDist = Math.abs(bars[0].x + bars[0].width / 2 - pointerX);
  for (let i = 1; i < bars.length; i += 1) {
    const cx = bars[i].x + bars[i].width / 2;
    const dist = Math.abs(cx - pointerX);
    if (dist < bestDist) {
      best = bars[i];
      bestDist = dist;
    }
  }
  return best;
}
