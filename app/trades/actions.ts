"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseTradeForm } from "@/lib/parse-trade-form";

const SCREENSHOT_BUCKET = "trade-screenshots";

// The <input accept="image/*"> hint in the form is client-side only and
// trivially bypassed -- these are the actual server-side checks.
const ALLOWED_SCREENSHOT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024; // 8MB

function validateScreenshot(file: File) {
  if (!ALLOWED_SCREENSHOT_TYPES.has(file.type)) {
    throw new Error("Screenshot must be a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    throw new Error("Screenshot must be 8MB or smaller.");
  }
}

async function uploadScreenshotIfPresent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData
): Promise<string | null> {
  const file = formData.get("screenshot") as File | null;
  if (!file || file.size === 0) return null;

  validateScreenshot(file);

  const path = `${userId}/${randomUUID()}-${file.name}`;
  const { error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) {
    throw new Error(`Screenshot upload failed: ${error.message}`);
  }

  return path;
}

export async function createTrade(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let fields: ReturnType<typeof parseTradeForm>;
  let screenshot_url: string | null;
  try {
    fields = parseTradeForm(formData);
    screenshot_url = await uploadScreenshotIfPresent(supabase, user.id, formData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid trade details.";
    redirect(`/trades/new?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("trades").insert({
    ...fields,
    screenshot_url,
    user_id: user.id,
  });

  if (error) {
    redirect(`/trades/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/trades");
  redirect("/trades");
}

export async function updateTrade(tradeId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let fields: ReturnType<typeof parseTradeForm>;
  let newScreenshotPath: string | null;
  try {
    fields = parseTradeForm(formData);
    newScreenshotPath = await uploadScreenshotIfPresent(supabase, user.id, formData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid trade details.";
    redirect(`/trades/${tradeId}/edit?error=${encodeURIComponent(message)}`);
  }

  const update: Record<string, unknown> = { ...fields };
  if (newScreenshotPath) {
    update.screenshot_url = newScreenshotPath;
  }

  const { error } = await supabase
    .from("trades")
    .update(update)
    .eq("id", tradeId);

  if (error) {
    redirect(`/trades/${tradeId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/trades");
  redirect("/trades");
}

export async function deleteTrade(tradeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("trades").delete().eq("id", tradeId);

  revalidatePath("/trades");
  redirect("/trades");
}
