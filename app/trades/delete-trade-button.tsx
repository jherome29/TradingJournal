"use client";

import { useTransition } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { deleteTrade } from "./actions";

export function DeleteTradeButton({
  tradeId,
  className,
  label = "Delete",
}: {
  tradeId: string;
  className?: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button className={className ?? "text-sm text-loss hover:underline"}>{label}</button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="animate-overlay fixed inset-0 bg-black/70" />
        <AlertDialog.Content className="animate-dialog fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border border-border bg-surface p-6">
          <AlertDialog.Title className="text-base font-medium">
            Delete this trade?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            The entry and its screenshot are removed permanently. This can&rsquo;t be undone.
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-4 text-sm">
            <AlertDialog.Cancel asChild>
              <button className="text-muted-foreground hover:text-foreground">Cancel</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => deleteTrade(tradeId))}
                className="rounded-sm bg-loss px-3 py-1.5 font-medium text-background transition-transform hover:brightness-110 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
