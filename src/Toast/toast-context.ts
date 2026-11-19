import { createContext } from "react";

export type ToastTone = "neutral" | "success" | "warning" | "danger" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

export type ToastContextValue = {
  push: (toast: ToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
