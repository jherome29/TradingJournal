"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/trade-stats";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reduced;
}

export function EquityChart({ data }: { data: EquityPoint[] }) {
  const reducedMotion = useReducedMotion();
  const lastIndex = data.length - 1;

  if (data.length < 2) {
    return (
      <p className="border-y border-border py-6 text-sm text-muted-foreground">
        Log a few more closed trades to see the equity curve.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8863e" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#b8863e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="traded_on"
          tick={{ fill: "#8c8574", fontSize: 11, fontFamily: "var(--font-sans)" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(237,230,214,0.1)" }}
          minTickGap={32}
        />
        <YAxis
          tick={{ fill: "#8c8574", fontSize: 11, fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: "#1f1d14",
            border: "1px solid rgba(237,230,214,0.1)",
            borderRadius: 2,
            fontSize: 12,
          }}
          labelStyle={{ color: "#8c8574" }}
          itemStyle={{ fontFamily: "var(--font-mono)" }}
          formatter={(value) => {
            const numeric = typeof value === "number" ? value : Number(value);
            return [`$${numeric.toFixed(2)}`, "Cumulative P/L"];
          }}
        />
        <Area
          type="monotone"
          dataKey="cumulativePnl"
          stroke="#b8863e"
          strokeWidth={2}
          fill="url(#equityFill)"
          isAnimationActive={!reducedMotion}
          animationDuration={900}
          animationEasing="ease-out"
          dot={(props: { cx?: number; cy?: number; index?: number }) => {
            if (props.index !== lastIndex || props.cx == null || props.cy == null) {
              return <g key={`dot-${props.index}`} />;
            }
            return (
              <g key="live-dot">
                {!reducedMotion && (
                  <circle cx={props.cx} cy={props.cy} r={3} fill="none" stroke="#b8863e" strokeWidth={1.5}>
                    <animate attributeName="r" values="3;9;3" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={props.cx} cy={props.cy} r={3} fill="#b8863e" />
              </g>
            );
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
