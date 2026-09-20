import { signIn, signUp } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Trading Journal</h1>
          <p className="text-sm text-neutral-400">Sign in to your journal.</p>
        </div>

        <form className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-neutral-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-neutral-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>

          {searchParams.error && (
            <p className="text-sm text-red-400">{searchParams.error}</p>
          )}
          {searchParams.message && (
            <p className="text-sm text-emerald-400">{searchParams.message}</p>
          )}

          <div className="flex gap-2">
            <button
              formAction={signIn}
              className="flex-1 rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
            >
              Sign in
            </button>
            <button
              formAction={signUp}
              className="flex-1 rounded-md border border-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-900"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
