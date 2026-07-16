import { buildPeriodOptions } from "@/lib/period";
import { PeriodSelectorClient } from "./period-selector-client";

export function PeriodSelector() {
  const options = buildPeriodOptions(24);
  return <PeriodSelectorClient options={options} />;
}
