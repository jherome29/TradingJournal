"use client";

import { useEffect, useRef, useState } from "react";

/** Ticks a number from 0 to `value` once on mount. One deliberate motion
    moment on figures that matter — not a scroll effect scattered everywhere.
    `delay` staggers multiple instances on the same page so they don't all
    land in mechanical lockstep. */
export function CountUp({
  value,
  duration = 700,
  delay = 0,
}: {
  value: number;
  duration?: number;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let start: number | null = null;

    function tick(now: number) {
      if (start === null) start = now;
      const elapsed = now - start;
      if (elapsed < delay) {
        frame.current = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((elapsed - delay) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(value * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return <>{Math.abs(display).toFixed(2)}</>;
}
