import type { HybridInputProps } from "./types";
import { LinesHybrid } from "./variants/LinesHybrid";
import { MoneyHybrid } from "./variants/MoneyHybrid";
import { SearchHybrid } from "./variants/SearchHybrid";
import { TagsHybrid } from "./variants/TagsHybrid";

export function HybridInput(props: HybridInputProps) {
  switch (props.variant) {
    case "tags":
      return <TagsHybrid {...props} />;
    case "lines":
      return <LinesHybrid {...props} />;
    case "money":
      return <MoneyHybrid {...props} />;
    case "search":
    default:
      return <SearchHybrid {...props} />;
  }
}
