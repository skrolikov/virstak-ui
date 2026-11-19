import { useEffect, useMemo } from "react";

import { ChartTooltip } from "../ChartTooltip/ChartTooltip";
import { hitTestBar, layoutBars } from "../geometry";
import {
  readCssVar,
  setupHiDpiCanvas,
  toneToCssVar,
} from "../utils";
import { useCanvasSize } from "../useCanvasSize";
import { useChartHover } from "../useChartHover";
import type { ChartTone } from "../types";
import { cx } from "../../lib/cx";

import styles from "./BarChart.module.css";

export type BarChartProps = {
  values: number[];
  labels?: string[];
  tone?: ChartTone;
  valueSuffix?: string;
  className?: string;
  "aria-label"?: string;
};

export function BarChart({
  values,
  labels = [],
  tone = "brand",
  valueSuffix = "",
  className,
  "aria-label": ariaLabel = "Bar chart",
}: BarChartProps) {
  const { ref, width, height } = useCanvasSize<HTMLCanvasElement>();
  const { activeIndex, model, show, hide } = useChartHover();

  const pads = useMemo(
    () => ({ padX: 4, padTop: 8, padBottom: 20 }),
    [],
  );

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width === 0 || height === 0 || values.length === 0) return;

    const ctx = setupHiDpiCanvas(canvas, width, height);
    if (!ctx) return;

    const color = readCssVar(canvas, toneToCssVar(tone), "#50ba88");
    const muted = readCssVar(canvas, "--color-text-secondary", "#9298a5");
    const layout = layoutBars(values, labels, width, height, pads);

    ctx.clearRect(0, 0, width, height);

    layout.bars.forEach((bar) => {
      const active = activeIndex === bar.index;
      const radius = Math.min(8, bar.width / 2);

      ctx.fillStyle = color;
      ctx.globalAlpha = active ? 1 : 0.72;
      ctx.beginPath();
      ctx.moveTo(bar.x, bar.y + radius);
      ctx.arcTo(bar.x, bar.y, bar.x + bar.width, bar.y, radius);
      ctx.arcTo(
        bar.x + bar.width,
        bar.y,
        bar.x + bar.width,
        bar.y + bar.height,
        radius,
      );
      ctx.lineTo(bar.x + bar.width, bar.y + bar.height);
      ctx.lineTo(bar.x, bar.y + bar.height);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      if (active) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();
      }

      if (bar.label) {
        ctx.fillStyle = muted;
        ctx.font = "11px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(bar.label, bar.x + bar.width / 2, height - 6);
      }
    });
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
        const pointerY = event.clientY - rect.top;
        const layout = layoutBars(values, labels, width, height, pads);
        const bar = hitTestBar(layout.bars, pointerX, pointerY);
        if (!bar) return;

        const accent = readCssVar(canvas, toneToCssVar(tone), "#50ba88");
        show(event, bar.index, {
          label: bar.label || `Слот ${bar.index + 1}`,
          value: `${bar.value}${valueSuffix}`,
          meta: "Throughput",
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
