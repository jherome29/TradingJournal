"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  const host = headers().get("host")!;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/reset-password`,
  });

  // Same message whether or not the email is registered -- otherwise this
  // becomes a way to enumerate accounts by email address.
  redirect(
    `/forgot-password?message=${encodeURIComponent(
      "If an account exists for that email, a reset link is on its way."
    )}`
  );
}
