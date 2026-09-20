"use client";

import { DateField, DateInput, DateSegment } from "react-aria-components";
import { parseDate, type CalendarDate } from "@internationalized/date";

export function TradeDateField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string; // YYYY-MM-DD
}) {
  let parsed: CalendarDate | undefined;
  try {
    parsed = defaultValue ? parseDate(defaultValue) : undefined;
  } catch {
    parsed = undefined;
  }

  return (
    <DateField name={name} defaultValue={parsed} granularity="day" aria-label="Date">
      <DateInput className="flex w-full gap-0.5 rounded-sm border border-border bg-surface px-3 py-2 font-mono text-sm focus-within:border-accent">
        {(segment) => (
          <DateSegment
            segment={segment}
            className="rounded-sm px-0.5 tabular-nums text-foreground outline-none focus:bg-accent focus:text-accent-foreground data-[type=literal]:text-muted-foreground"
          />
        )}
      </DateInput>
    </DateField>
  );
}
