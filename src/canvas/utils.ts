import type { ChartTone } from "./types";

export function readCssVar(
  el: Element | null,
  name: string,
  fallback: string,
): string {
  if (!el) return fallback;
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}

export function toneToCssVar(tone: ChartTone): string {
  switch (tone) {
    case "brand":
      return "--color-brand";
    case "info":
      return "--color-info";
    case "warning":
      return "--color-warning";
    case "danger":
      return "--color-danger";
    default:
      return "--color-text-secondary";
  }
}

export function setupHiDpiCanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
  canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const norm = value / pow;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * pow;
}

export function buildPath(
  values: number[],
  width: number,
  height: number,
  pad = 2,
): { line: Path2D; area: Path2D; max: number } {
  const max = niceMax(Math.max(...values, 0));
  const usableW = Math.max(width - pad * 2, 1);
  const usableH = Math.max(height - pad * 2, 1);
  const step = values.length > 1 ? usableW / (values.length - 1) : usableW;

  const line = new Path2D();
  const area = new Path2D();

  values.forEach((value, index) => {
    const x = pad + index * step;
    const y = pad + usableH - (value / max) * usableH;
    if (index === 0) {
      line.moveTo(x, y);
      area.moveTo(x, pad + usableH);
      area.lineTo(x, y);
    } else {
      line.lineTo(x, y);
      area.lineTo(x, y);
    }
  });

  const lastX = pad + (values.length - 1) * step;
  area.lineTo(lastX, pad + usableH);
  area.closePath();

  return { line, area, max };
}
