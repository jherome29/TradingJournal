import Link from "next/link";
import type { DateRange } from "@/lib/date-range";

const OPTIONS: { value: DateRange; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

/** Server-rendered segmented control; each option is a plain link carrying
    ?range= so the page re-renders with new searchParams -- no client JS needed. */
export function RangeFilter({ basePath, current }: { basePath: string; current: DateRange }) {
  return (
    <div className="flex gap-1 text-sm">
      {OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={opt.value === "all" ? basePath : `${basePath}?range=${opt.value}`}
          className={`rounded-sm px-3 py-1.5 transition-colors ${
            current === opt.value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-surface hover:text-foreground"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
