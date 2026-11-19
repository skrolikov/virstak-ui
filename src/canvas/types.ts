export type CanvasPoint = {
  x: number | string;
  y: number;
};

export type CanvasSeries = {
  id: string;
  label?: string;
  values: number[];
  color?: string;
};

export type ChartTone = "brand" | "info" | "warning" | "danger" | "neutral";
