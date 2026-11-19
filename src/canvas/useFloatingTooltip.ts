import { useCallback, useState } from "react";

import type { ChartTooltipModel } from "./ChartTooltip/ChartTooltip";

const OFFSET_X = 16;
const OFFSET_Y = 14;
const TIP_WIDTH = 168;
const TIP_HEIGHT = 78;

function clampTooltip(x: number, y: number) {
  const maxX = Math.max(8, window.innerWidth - TIP_WIDTH - 8);
  const maxY = Math.max(8, window.innerHeight - TIP_HEIGHT - 8);
  return {
    x: Math.min(Math.max(8, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
  };
}

export function useFloatingTooltip() {
  const [model, setModel] = useState<ChartTooltipModel>({
    visible: false,
    x: 0,
    y: 0,
    value: "",
  });

  const showAt = useCallback(
    (
      clientX: number,
      clientY: number,
      payload: Omit<ChartTooltipModel, "visible" | "x" | "y">,
    ) => {
      let x = clientX + OFFSET_X;
      let y = clientY + OFFSET_Y;

      // Keep tooltip near cursor; flip if near right/bottom edge
      if (x + TIP_WIDTH > window.innerWidth - 8) {
        x = clientX - TIP_WIDTH - 12;
      }
      if (y + TIP_HEIGHT > window.innerHeight - 8) {
        y = clientY - TIP_HEIGHT - 12;
      }

      const next = clampTooltip(x, y);
      setModel({
        visible: true,
        x: next.x,
        y: next.y,
        ...payload,
      });
    },
    [],
  );

  const hide = useCallback(() => {
    setModel((current) =>
      current.visible ? { ...current, visible: false } : current,
    );
  }, []);

  return { model, showAt, hide };
}
