"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";

const SESSIONS = ["New York", "London", "Asia"] as const;

export function SessionSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <Select.Root name={name} defaultValue={defaultValue ?? undefined}>
      <Select.Trigger className="flex w-full items-center justify-between rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
        <Select.Value placeholder="Unspecified" />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="animate-dropdown overflow-hidden rounded-sm border border-border bg-surface-raised text-sm shadow-lg">
          <Select.Viewport className="p-1">
            {SESSIONS.map((session) => (
              <Select.Item
                key={session}
                value={session}
                className="flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 outline-none data-[highlighted]:bg-surface"
              >
                <Select.ItemText>{session}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
