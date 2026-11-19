import { useCallback, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { ChartTooltipModel } from "./ChartTooltip/ChartTooltip";

const OFFSET_X = 16;
const OFFSET_Y = 12;

function clamp(x: number, y: number) {
  const tipW = 168;
  const tipH = 78;
  return {
    x: Math.min(Math.max(8, x), window.innerWidth - tipW - 8),
    y: Math.min(Math.max(8, y), window.innerHeight - tipH - 8),
  };
}

export function useChartHover() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [model, setModel] = useState<ChartTooltipModel>({
    visible: false,
    x: 0,
    y: 0,
    value: "",
  });

  const hide = useCallback(() => {
    setActiveIndex(null);
    setModel((current) =>
      current.visible ? { ...current, visible: false } : current,
    );
  }, []);

  const show = useCallback(
    (
      event: Pick<ReactPointerEvent, "clientX" | "clientY">,
      index: number,
      payload: Omit<ChartTooltipModel, "visible" | "x" | "y">,
    ) => {
      const pos = clamp(event.clientX + OFFSET_X, event.clientY - OFFSET_Y);
      setActiveIndex(index);
      setModel({
        visible: true,
        x: pos.x,
        y: pos.y,
        label: payload.label || "Значение",
        value: payload.value,
        meta: payload.meta,
        accent: payload.accent,
      });
    },
    [],
  );

  return { activeIndex, model, show, hide };
}
