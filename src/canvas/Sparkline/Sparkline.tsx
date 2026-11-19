import { useEffect, useState } from "react";

import { ChartTooltip } from "../ChartTooltip/ChartTooltip";
import { layoutLinePoints, nearestPoint } from "../geometry";
import {
  buildPath,
  readCssVar,
  setupHiDpiCanvas,
  toneToCssVar,
} from "../utils";
import { useCanvasSize } from "../useCanvasSize";
import { useFloatingTooltip } from "../useFloatingTooltip";
import type { ChartTone } from "../types";
import { cx } from "../../lib/cx";

import styles from "./Sparkline.module.css";

export type SparklineProps = {
  values: number[];
  labels?: string[];
  tone?: ChartTone;
  fill?: boolean;
  valueSuffix?: string;
  className?: string;
  "aria-label"?: string;
};

export function Sparkline({
  values,
  labels = [],
  tone = "brand",
  fill = true,
  valueSuffix = "",
  className,
  "aria-label": ariaLabel = "Sparkline",
}: SparklineProps) {
  const { ref, width, height } = useCanvasSize<HTMLCanvasElement>();
  const { model, showAt, hide } = useFloatingTooltip();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width === 0 || height === 0 || values.length === 0) return;

    const ctx = setupHiDpiCanvas(canvas, width, height);
    if (!ctx) return;

    const color = readCssVar(canvas, toneToCssVar(tone), "#50ba88");
    const pads = { padX: 3, padTop: 3, padBottom: 3 };
    const layout = layoutLinePoints(values, labels, width, height, pads);
    const { line, area } = buildPath(values, width, height, 3);

    ctx.clearRect(0, 0, width, height);

    if (fill) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = color;
      ctx.fill(area);
      ctx.restore();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.75;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke(line);

    if (activeIndex !== null) {
      const point = layout.points[activeIndex];
      if (point) {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = readCssVar(canvas, "--color-surface", "#14161b");
        ctx.stroke();
      }
    }
  }, [ref, width, height, values, labels, tone, fill, activeIndex]);

  return (
    <div className={cx(styles.root, className)}>
      <canvas
        ref={ref}
        className={styles.canvas}
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => {
          setActiveIndex(null);
          hide();
        }}
        onMouseMove={(event) => {
          const canvas = ref.current;
          if (!canvas || values.length === 0) return;
          const rect = canvas.getBoundingClientRect();
          const pointerX = event.clientX - rect.left;
          const pads = { padX: 3, padTop: 3, padBottom: 3 };
          const layout = layoutLinePoints(values, labels, width, height, pads);
          const point = nearestPoint(layout.points, pointerX);
          if (!point) return;

          setActiveIndex(point.index);
          const accent = readCssVar(canvas, toneToCssVar(tone), "#50ba88");
          showAt(event.clientX, event.clientY, {
            label: point.label ?? `Точка ${point.index + 1}`,
            value: `${point.value}${valueSuffix}`,
            accent,
          });
        }}
      />
      <ChartTooltip model={model} />
    </div>
  );
}
