"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseTradeForm } from "@/lib/parse-trade-form";

const SCREENSHOT_BUCKET = "trade-screenshots";

async function uploadScreenshotIfPresent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData
): Promise<string | null> {
  const file = formData.get("screenshot") as File | null;
  if (!file || file.size === 0) return null;

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

  const fields = parseTradeForm(formData);
  const screenshot_url = await uploadScreenshotIfPresent(supabase, user.id, formData);

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

  const fields = parseTradeForm(formData);
  const newScreenshotPath = await uploadScreenshotIfPresent(supabase, user.id, formData);

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
