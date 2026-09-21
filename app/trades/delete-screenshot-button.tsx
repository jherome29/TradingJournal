"use client";

import { useTransition } from "react";
import { deleteScreenshot } from "./actions";

export function DeleteScreenshotButton({
  tradeId,
  screenshotId,
  className,
}: {
  tradeId: string;
  screenshotId: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => deleteScreenshot(tradeId, screenshotId))}
      className={className}
      aria-label="Remove screenshot"
    >
      {isPending ? "…" : "✕"}
    </button>
  );
}
