// Integration test: verifies RLS actually enforces cross-user isolation on
// the real Supabase project (not mocked). Requires two dedicated test
// accounts and the same env vars the app itself uses. Skips entirely (not
// fails) when those aren't present -- e.g. in CI jobs that don't have
// Supabase secrets configured, or for a contributor without project access.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const USER_A_EMAIL = process.env.E2E_TEST_USER_A_EMAIL;
const USER_A_PASSWORD = process.env.E2E_TEST_USER_A_PASSWORD;
const USER_B_EMAIL = process.env.E2E_TEST_USER_B_EMAIL;
const USER_B_PASSWORD = process.env.E2E_TEST_USER_B_PASSWORD;

const hasCredentials = Boolean(
  SUPABASE_URL && SUPABASE_KEY && USER_A_EMAIL && USER_A_PASSWORD && USER_B_EMAIL && USER_B_PASSWORD
);

async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL!, SUPABASE_KEY!);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  return client;
}

describe.skipIf(!hasCredentials)("RLS: trades table cross-user isolation", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let userAId: string;
  let tradeId: string;

  beforeAll(async () => {
    clientA = await signedInClient(USER_A_EMAIL!, USER_A_PASSWORD!);
    clientB = await signedInClient(USER_B_EMAIL!, USER_B_PASSWORD!);

    const {
      data: { user },
    } = await clientA.auth.getUser();
    userAId = user!.id;

    const { data, error } = await clientA
      .from("trades")
      .insert({
        user_id: userAId,
        traded_on: "2026-01-01",
        direction: "long",
        entry_price: 100,
        size: 1,
      })
      .select()
      .single();
    if (error) throw error;
    tradeId = data.id;
  });

  afterAll(async () => {
    if (tradeId) {
      await clientA.from("trades").delete().eq("id", tradeId);
    }
  });

  it("prevents user B from seeing user A's trade", async () => {
    const { data } = await clientB.from("trades").select("*").eq("id", tradeId);
    expect(data).toEqual([]);
  });

  it("prevents user B from updating user A's trade", async () => {
    const { data } = await clientB
      .from("trades")
      .update({ pnl: 999 })
      .eq("id", tradeId)
      .select();
    // RLS silently matches zero rows rather than erroring.
    expect(data).toEqual([]);

    const { data: stillOwned } = await clientA.from("trades").select("pnl").eq("id", tradeId).single();
    expect(stillOwned?.pnl).toBeNull();
  });

  it("prevents user B from deleting user A's trade", async () => {
    const { data } = await clientB.from("trades").delete().eq("id", tradeId).select();
    expect(data).toEqual([]);

    const { data: stillExists } = await clientA.from("trades").select("id").eq("id", tradeId).single();
    expect(stillExists?.id).toBe(tradeId);
  });

  it("still allows user A to read their own trade", async () => {
    const { data } = await clientA.from("trades").select("*").eq("id", tradeId).single();
    expect(data?.user_id).toBe(userAId);
  });
});

describe.skipIf(!hasCredentials)("RLS: trade_screenshots cross-user isolation", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let tradeId: string;
  let screenshotId: string;

  beforeAll(async () => {
    clientA = await signedInClient(USER_A_EMAIL!, USER_A_PASSWORD!);
    clientB = await signedInClient(USER_B_EMAIL!, USER_B_PASSWORD!);

    const {
      data: { user },
    } = await clientA.auth.getUser();

    const { data: trade, error: tradeError } = await clientA
      .from("trades")
      .insert({
        user_id: user!.id,
        traded_on: "2026-01-01",
        direction: "long",
        entry_price: 100,
        size: 1,
      })
      .select()
      .single();
    if (tradeError) throw tradeError;
    tradeId = trade.id;

    // Ownership of trade_screenshots is derived entirely from the parent
    // trade (no user_id column on this table), so this is the row that
    // actually exercises the EXISTS-join policy.
    const { data: screenshot, error: screenshotError } = await clientA
      .from("trade_screenshots")
      .insert({ trade_id: tradeId, storage_path: `${user!.id}/rls-test.png`, position: 0 })
      .select()
      .single();
    if (screenshotError) throw screenshotError;
    screenshotId = screenshot.id;
  });

  afterAll(async () => {
    if (tradeId) {
      await clientA.from("trades").delete().eq("id", tradeId);
    }
  });

  it("prevents user B from seeing user A's screenshot", async () => {
    const { data } = await clientB.from("trade_screenshots").select("*").eq("id", screenshotId);
    expect(data).toEqual([]);
  });

  it("prevents user B from inserting a screenshot on user A's trade", async () => {
    const { error } = await clientB
      .from("trade_screenshots")
      .insert({ trade_id: tradeId, storage_path: "attacker/x.png", position: 1 });
    expect(error).not.toBeNull();
  });

  it("prevents user B from deleting user A's screenshot", async () => {
    const { data } = await clientB
      .from("trade_screenshots")
      .delete()
      .eq("id", screenshotId)
      .select();
    expect(data).toEqual([]);

    const { data: stillExists } = await clientA
      .from("trade_screenshots")
      .select("id")
      .eq("id", screenshotId)
      .single();
    expect(stillExists?.id).toBe(screenshotId);
  });

  it("still allows user A to read their own screenshot", async () => {
    const { data } = await clientA
      .from("trade_screenshots")
      .select("*")
      .eq("id", screenshotId)
      .single();
    expect(data?.trade_id).toBe(tradeId);
  });

  it("removes screenshots when the parent trade is deleted (cascade)", async () => {
    await clientA.from("trades").delete().eq("id", tradeId);
    const { data } = await clientA
      .from("trade_screenshots")
      .select("id")
      .eq("id", screenshotId);
    expect(data).toEqual([]);
    tradeId = ""; // already deleted, skip the afterAll cleanup
  });
});
