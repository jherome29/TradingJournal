import Link from "next/link";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <p className="font-mono text-xs text-accent">
            XAU/USD<span className="animate-cursor-blink">_</span>
          </p>
          <h1 className="text-2xl font-medium">Journal</h1>
        </div>

        <form className="space-y-4">
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

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          {params.error && (
            <p className="text-sm text-loss">{params.error}</p>
          )}
          {params.message && (
            <p className="text-sm text-profit">{params.message}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              formAction={signIn}
              className="flex-1 rounded-sm bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-transform hover:brightness-110 active:scale-[0.97]"
            >
              Sign in
            </button>
            <button
              formAction={signUp}
              className="flex-1 rounded-sm border border-border px-3 py-2 text-sm font-medium transition-transform hover:bg-surface active:scale-[0.97]"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
