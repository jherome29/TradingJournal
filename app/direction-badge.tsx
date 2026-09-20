import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Direction } from "@/lib/types";

/** Some imported historical trades have no recorded direction -- shown
    neutrally rather than defaulting to either color. */
export function DirectionBadge({ direction }: { direction: Direction | null }) {
  const colorClass =
    direction === "long"
      ? "text-profit"
      : direction === "short"
        ? "text-loss"
        : "text-muted-foreground";
  const Icon = direction === "long" ? TrendingUp : direction === "short" ? TrendingDown : Minus;
  const label = direction === "long" ? "Long" : direction === "short" ? "Short" : "—";

  return (
    <span className={`flex items-center gap-1.5 ${colorClass}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {label}
    </span>
  );
}
