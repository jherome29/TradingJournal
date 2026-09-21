import Link from "next/link";
import { fetchAllTrades } from "@/lib/fetch-trades";
import { computeDailyPnl } from "@/lib/trade-stats";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseMonthParam(month?: string): { year: number; monthIndex: number } {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return { year: y, monthIndex: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

function monthParam(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

/** Only days with an actual entry get tinted — empty days stay neutral. */
function pnlIntensityStyle(pnl: number, maxAbsPnl: number) {
  const intensity = maxAbsPnl === 0 ? 0 : Math.min(Math.abs(pnl) / maxAbsPnl, 1);
  const alpha = 0.15 + 0.65 * intensity;
  const color = pnl >= 0 ? "91, 155, 118" : "192, 106, 79"; // profit / loss RGB
  return {
    backgroundColor: `rgba(${color}, ${alpha})`,
    boxShadow:
      intensity > 0.4
        ? `0 0 ${8 + intensity * 16}px -4px rgba(${color}, ${intensity * 0.9})`
        : undefined,
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const trades = await fetchAllTrades();
  const daily = computeDailyPnl(trades);
  const dailyByDate = new Map(daily.map((d) => [d.date, d]));
  const maxAbsPnl = Math.max(1, ...daily.map((d) => Math.abs(d.pnl)));

  const { month } = await searchParams;
  const { year, monthIndex } = parseMonthParam(month);
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();

  const prev = new Date(year, monthIndex - 1, 1);
  const next = new Date(year, monthIndex + 1, 1);

  const cells: { date: string | null; day: number | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date, day: d });
  }

  const monthDaily = daily.filter((d) => d.date.startsWith(monthParam(year, monthIndex)));
  const monthTotal = monthDaily.reduce((sum, d) => sum + d.pnl, 0);
  const bestDay = monthDaily.length
    ? monthDaily.reduce((best, d) => (d.pnl > best.pnl ? d : best))
    : null;
  const worstDay = monthDaily.length
    ? monthDaily.reduce((worst, d) => (d.pnl < worst.pnl ? d : worst))
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Calendar</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={`/calendar?month=${monthParam(prev.getFullYear(), prev.getMonth())}`}
            className="text-muted-foreground transition-transform hover:text-foreground motion-safe:hover:-translate-x-0.5"
          >
            ← Prev
          </Link>
          <span className="w-40 text-center font-medium">
            {MONTH_NAMES[monthIndex]} {year}
          </span>
          <Link
            href={`/calendar?month=${monthParam(next.getFullYear(), next.getMonth())}`}
            className="text-muted-foreground transition-transform hover:text-foreground motion-safe:hover:translate-x-0.5"
          >
            Next →
          </Link>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Month total:{" "}
        <span className={monthTotal >= 0 ? "text-profit" : "text-loss"}>
          {monthTotal >= 0 ? "+" : ""}${monthTotal.toFixed(2)}
        </span>
      </p>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={`empty-${i}`} />;
          const entry = dailyByDate.get(cell.date);
          const isBest = entry && bestDay && entry.date === bestDay.date && entry.pnl > 0;
          const isWorst = entry && worstDay && entry.date === worstDay.date && entry.pnl < 0;
          return (
            <div
              key={cell.date}
              className={`animate-cell-in relative flex aspect-square flex-col items-center justify-center rounded-sm border text-xs transition-transform duration-150 motion-safe:hover:z-10 motion-safe:hover:scale-110 ${
                isBest
                  ? "animate-pulse-glow-profit border-profit"
                  : isWorst
                    ? "animate-pulse-glow-loss border-loss"
                    : "border-border"
              }`}
              style={{
                ...(entry ? pnlIntensityStyle(entry.pnl, maxAbsPnl) : {}),
                animationDelay: `${i * 12}ms`,
              }}
              title={
                entry
                  ? `${cell.date}: ${entry.pnl >= 0 ? "+" : ""}$${entry.pnl.toFixed(2)} (${entry.count} trade${entry.count > 1 ? "s" : ""})`
                  : cell.date
              }
            >
              <span className="text-muted-foreground">{cell.day}</span>
              {entry && (
                <span className={entry.pnl >= 0 ? "text-profit" : "text-loss"}>
                  {entry.pnl >= 0 ? "+" : ""}
                  {Math.round(entry.pnl)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
