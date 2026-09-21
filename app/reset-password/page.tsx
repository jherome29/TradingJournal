import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <p className="font-mono text-xs text-accent">
            XAU/USD<span className="animate-cursor-blink">_</span>
          </p>
          <h1 className="text-2xl font-medium">Set a new password</h1>
        </div>

        <ResetPasswordForm />
      </div>
    </main>
  );
}
