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
    throw new Error("Screenshots must be JPEG, PNG, WebP, or GIF images.");
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    throw new Error("Each screenshot must be 8MB or smaller.");
  }
}

/** A trade can have any number of screenshots; the <input multiple> field submits them all under the same "screenshots" key. */
function getScreenshotFiles(formData: FormData): File[] {
  return formData
    .getAll("screenshots")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function uploadScreenshots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  files: File[]
): Promise<string[]> {
  files.forEach(validateScreenshot);

  const paths: string[] = [];
  for (const file of files) {
    const path = `${userId}/${randomUUID()}-${file.name}`;
    const { error } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .upload(path, file, { upsert: false });
    if (error) {
      throw new Error(`Screenshot upload failed: ${error.message}`);
    }
    paths.push(path);
  }
  return paths;
}

async function insertScreenshotRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tradeId: string,
  paths: string[],
  startPosition: number
) {
  if (paths.length === 0) return;

  const { error } = await supabase.from("trade_screenshots").insert(
    paths.map((storage_path, i) => ({
      trade_id: tradeId,
      storage_path,
      position: startPosition + i,
    }))
  );
  if (error) {
    throw new Error(`Saving screenshot(s) failed: ${error.message}`);
  }
}

export async function createTrade(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let fields: ReturnType<typeof parseTradeForm>;
  let screenshotPaths: string[];
  try {
    fields = parseTradeForm(formData);
    screenshotPaths = await uploadScreenshots(supabase, user.id, getScreenshotFiles(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid trade details.";
    redirect(`/trades/new?error=${encodeURIComponent(message)}`);
  }

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({ ...fields, user_id: user.id })
    .select("id")
    .single();

  if (error || !trade) {
    redirect(`/trades/new?error=${encodeURIComponent(error?.message ?? "Could not save trade.")}`);
  }

  await insertScreenshotRows(supabase, trade.id, screenshotPaths, 0);

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
  let newScreenshotPaths: string[];
  try {
    fields = parseTradeForm(formData);
    newScreenshotPaths = await uploadScreenshots(supabase, user.id, getScreenshotFiles(formData));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid trade details.";
    redirect(`/trades/${tradeId}/edit?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("trades").update(fields).eq("id", tradeId);
  if (error) {
    redirect(`/trades/${tradeId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  // New screenshots are appended after whatever is already attached.
  const { count } = await supabase
    .from("trade_screenshots")
    .select("id", { count: "exact", head: true })
    .eq("trade_id", tradeId);
  await insertScreenshotRows(supabase, tradeId, newScreenshotPaths, count ?? 0);

  revalidatePath("/trades");
  redirect("/trades");
}

export async function deleteScreenshot(tradeId: string, screenshotId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: screenshot } = await supabase
    .from("trade_screenshots")
    .select("storage_path")
    .eq("id", screenshotId)
    .single();

  if (screenshot) {
    await supabase.storage.from(SCREENSHOT_BUCKET).remove([screenshot.storage_path]);
    await supabase.from("trade_screenshots").delete().eq("id", screenshotId);
  }

  revalidatePath(`/trades/${tradeId}/edit`);
}

export async function deleteTrade(tradeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: screenshots } = await supabase
    .from("trade_screenshots")
    .select("storage_path")
    .eq("trade_id", tradeId);

  if (screenshots && screenshots.length > 0) {
    await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .remove(screenshots.map((s) => s.storage_path));
  }

  // trade_screenshots rows are removed automatically via the trade_id
  // foreign key's ON DELETE CASCADE.
  await supabase.from("trades").delete().eq("id", tradeId);

  revalidatePath("/trades");
  redirect("/trades");
}
