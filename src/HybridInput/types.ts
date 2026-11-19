import type { ReactNode } from "react";

export type HybridCreateMode = "none" | "inline" | "drawer";

export type HybridOption = {
  id: string;
  label: string;
  description?: string;
  meta?: ReactNode;
  disabled?: boolean;
};

export type HybridLineColumn =
  | "qty"
  | "expected"
  | "cost"
  | "sum"
  | "diff";

export type HybridLine = {
  key: string;
  optionId?: string;
  label: string;
  description?: string;
  unit?: string;
  quantity: number;
  expectedQuantity?: number;
  costPrice?: number;
};

export type HybridFilterFn = (
  option: HybridOption,
  query: string,
) => boolean;

export type HybridCommonProps = {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  createMode?: HybridCreateMode;
  createLabel?: (query: string) => string;
  onCreate?: (query: string) => Promise<HybridOption> | HybridOption;
  onCreateRequest?: (query: string) => void;
};

export type HybridSearchProps = HybridCommonProps & {
  variant: "search";
  options: HybridOption[];
  value: HybridOption | null;
  onChange: (value: HybridOption | null) => void;
  filter?: HybridFilterFn;
  clearable?: boolean;
  /**
   * chip — выбранный вариант как тег (по умолчанию)
   * inline — значение в самом input, можно править и искать
   */
  mode?: "chip" | "inline";
};

export type HybridTagsProps = HybridCommonProps & {
  variant: "tags";
  options: HybridOption[];
  value: HybridOption[];
  onChange: (value: HybridOption[]) => void;
  filter?: HybridFilterFn;
};

export type HybridMoneyProps = HybridCommonProps & {
  variant: "money";
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  currency?: string;
};

export type HybridLinesProps = HybridCommonProps & {
  variant: "lines";
  options: HybridOption[];
  value: HybridLine[];
  onChange: (value: HybridLine[]) => void;
  filter?: HybridFilterFn;
  columns?: HybridLineColumn[];
  getOptionMeta?: (option: HybridOption) => Partial<
    Pick<HybridLine, "unit" | "quantity" | "expectedQuantity" | "costPrice">
  >;
};

export type HybridInputProps =
  | HybridSearchProps
  | HybridTagsProps
  | HybridMoneyProps
  | HybridLinesProps;

export function defaultHybridFilter(
  option: HybridOption,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    option.label.toLowerCase().includes(q) ||
    (option.description?.toLowerCase().includes(q) ?? false)
  );
}
