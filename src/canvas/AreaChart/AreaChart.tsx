import { useEffect, useMemo } from "react";

import { ChartTooltip } from "../ChartTooltip/ChartTooltip";
import { layoutLinePoints, nearestPoint } from "../geometry";
import {
  buildPath,
  readCssVar,
  setupHiDpiCanvas,
  toneToCssVar,
} from "../utils";
import { useCanvasSize } from "../useCanvasSize";
import { useChartHover } from "../useChartHover";
import type { ChartTone } from "../types";
import { cx } from "../../lib/cx";

import styles from "./AreaChart.module.css";

export type AreaChartProps = {
  values: number[];
  labels?: string[];
  tone?: ChartTone;
  valueSuffix?: string;
  className?: string;
  "aria-label"?: string;
};

export function AreaChart({
  values,
  labels = [],
  tone = "brand",
  valueSuffix = "",
  className,
  "aria-label": ariaLabel = "Area chart",
}: AreaChartProps) {
  const { ref, width, height } = useCanvasSize<HTMLCanvasElement>();
  const { activeIndex, model, show, hide } = useChartHover();

  const pads = useMemo(
    () => ({ padX: 8, padTop: 12, padBottom: 22 }),
    [],
  );

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width === 0 || height === 0 || values.length === 0) return;

    const ctx = setupHiDpiCanvas(canvas, width, height);
    if (!ctx) return;

    const color = readCssVar(canvas, toneToCssVar(tone), "#50ba88");
    const muted = readCssVar(canvas, "--color-text-secondary", "#9298a5");
    const grid = readCssVar(canvas, "--color-border", "rgba(255,255,255,.08)");
    const layout = layoutLinePoints(values, labels, width, height, pads);

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i <= 3; i += 1) {
      const y = pads.padTop + (layout.chartH / 3) * i;
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pads.padX, y);
      ctx.lineTo(width - pads.padX, y);
      ctx.stroke();
    }

    const { line, area } = buildPath(values, layout.chartW, layout.chartH, 0);
    ctx.save();
    ctx.translate(pads.padX, pads.padTop);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = color;
    ctx.fill(area);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke(line);
    ctx.restore();

    if (activeIndex !== null) {
      const point = layout.points[activeIndex];
      if (point) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(point.x, pads.padTop);
        ctx.lineTo(point.x, pads.padTop + layout.chartH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#14161b";
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.fillStyle = muted;
    ctx.font = "11px Manrope, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    const labelCount = Math.min(labels.length, values.length);
    if (labelCount > 0) {
      const step = labelCount > 1 ? layout.chartW / (labelCount - 1) : 0;
      for (let i = 0; i < labelCount; i += 1) {
        const text = labels[i] ?? "";
        const x = pads.padX + i * step;
        const metrics = ctx.measureText(text);
        const textX =
          i === 0
            ? x
            : i === labelCount - 1
              ? x - metrics.width
              : x - metrics.width / 2;
        ctx.fillText(text, textX, height - 6);
      }
    }

    ctx.textAlign = "right";
    ctx.fillText(String(layout.max), width - pads.padX, 12);
  }, [ref, width, height, values, labels, tone, pads, activeIndex]);

  return (
    <div
      className={cx(styles.root, className)}
      onPointerLeave={hide}
      onPointerMove={(event) => {
        const canvas = ref.current;
        if (!canvas || width === 0 || values.length === 0) return;
        const rect = canvas.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const layout = layoutLinePoints(values, labels, width, height, pads);
        const point = nearestPoint(layout.points, pointerX);
        if (!point) return;

        const accent = readCssVar(canvas, toneToCssVar(tone), "#50ba88");
        show(event, point.index, {
          label: point.label || `Точка ${point.index + 1}`,
          value: `${point.value}${valueSuffix}`,
          meta: "Активность",
          accent,
        });
      }}
    >
      <canvas
        ref={ref}
        className={styles.canvas}
        role="img"
        aria-label={ariaLabel}
      />
      <ChartTooltip model={model} />
    </div>
  );
}
