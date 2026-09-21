import { createClient } from "@/lib/supabase/server";

const SCREENSHOT_BUCKET = "trade-screenshots";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, regenerated on every request

/** The bucket is private; screenshot_url stores the object path, not a usable URL. */
export async function getSignedScreenshotUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string
): Promise<string | null> {
  const { data } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}

export async function getSignedScreenshotUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;

  const { data } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  data?.forEach((entry) => {
    if (entry.signedUrl && entry.path) map.set(entry.path, entry.signedUrl);
  });
  return map;
}
