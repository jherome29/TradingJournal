"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform hover:brightness-110 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
