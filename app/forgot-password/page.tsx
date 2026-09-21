import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <p className="font-mono text-xs text-accent">
            XAU/USD<span className="animate-cursor-blink">_</span>
          </p>
          <h1 className="text-2xl font-medium">Reset your password</h1>
        </div>

        <form action={requestPasswordReset} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          {searchParams.message && (
            <p className="text-sm text-profit">{searchParams.message}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-transform hover:brightness-110 active:scale-[0.97]"
          >
            Send reset link
          </button>
        </form>

        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
