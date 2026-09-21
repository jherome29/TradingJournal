"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // The recovery link's tokens live in the URL fragment, which never
    // reaches the server -- the browser client picks them up itself
    // (detectSessionInUrl) and fires PASSWORD_RECOVERY once that session is
    // established. Also check immediately in case it already fired before
    // this listener was attached.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/dashboard");
  }

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground">
        Waiting for the reset link to verify&hellip; if this doesn&rsquo;t resolve in a
        few seconds, the link may have expired or already been used.{" "}
        <a href="/forgot-password" className="text-accent hover:underline">
          Request a new one
        </a>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm text-muted-foreground">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirm" className="text-sm text-muted-foreground">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-loss">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-transform hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
