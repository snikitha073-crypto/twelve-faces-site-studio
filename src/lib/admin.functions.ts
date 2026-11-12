import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const ownerStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isOwner } = await import("./admin.server");
  const configured = Boolean(process.env["ADMIN_PASSWORD"]);
  return { isOwner: await isOwner(), configured };
});

export const ownerLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) =>
    z.object({ email: z.string().trim().email().max(255), password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { ownerEmail, safeEqual, getOwnerSession, clientIp } = await import("./admin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) return { ok: false as const, error: "Owner login is not set up yet." };

    const ip = clientIp();
    const since = new Date(Date.now() - LOCKOUT_MINUTES * 60_000).toISOString();
    const { count } = await supabaseAdmin
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("success", false)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_FAILED_ATTEMPTS) {
      return { ok: false as const, error: `Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.` };
    }

    const emailOk = data.email.toLowerCase() === ownerEmail();
    const passOk = await safeEqual(data.password, expected);
    const success = emailOk && passOk;
    await supabaseAdmin.from("admin_login_attempts").insert({ ip, success });
    if (!success) {
      await new Promise((r) => setTimeout(r, 600));
      return { ok: false as const, error: "Incorrect email or password." };
    }
    const session = await getOwnerSession();
    await session.update({ role: "owner", email: ownerEmail(), loginAt: Date.now() });
    return { ok: true as const };
  });

export const ownerLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getOwnerSession } = await import("./admin.server");
  try {
    const session = await getOwnerSession();
    await session.clear();
  } catch {
    // no session
  }
  return { ok: true };
});

export const ownerDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { isOwner } = await import("./admin.server");
  if (!(await isOwner())) throw new Error("Unauthorized");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: profiles }, { data: debates }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select(
        "id, display_name, username, avatar_url, league, points, debates_completed, avg_score, show_on_leaderboard, created_at, last_seen_at",
      )
      .order("created_at", { ascending: false })
      .limit(1000),
    supabaseAdmin
      .from("debates")
      .select("user_id, status, mode, character_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const now = Date.now();
  const day = 86_400_000;
  const allProfiles = profiles ?? [];
  const allDebates = debates ?? [];

  const startedByUser = new Map<string, number>();
  for (const d of allDebates) startedByUser.set(d.user_id, (startedByUser.get(d.user_id) ?? 0) + 1);

  const perDay: { date: string; debates: number; profiles: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date(now - i * day);
    start.setUTCHours(0, 0, 0, 0);
    const end = start.getTime() + day;
    perDay.push({
      date: start.toISOString().slice(0, 10),
      debates: allDebates.filter((d) => {
        const t = new Date(d.created_at).getTime();
        return t >= start.getTime() && t < end;
      }).length,
      profiles: allProfiles.filter((p) => {
        const t = new Date(p.created_at).getTime();
        return t >= start.getTime() && t < end;
      }).length,
    });
  }

  const byCharacter: Record<string, number> = {};
  for (const d of allDebates) byCharacter[d.character_id] = (byCharacter[d.character_id] ?? 0) + 1;

  return {
    totals: {
      profiles: allProfiles.length,
      newProfiles7d: allProfiles.filter((p) => now - new Date(p.created_at).getTime() < 7 * day).length,
      activeNow: allProfiles.filter((p) => now - new Date(p.last_seen_at).getTime() < 5 * 60_000).length,
      active24h: allProfiles.filter((p) => now - new Date(p.last_seen_at).getTime() < day).length,
      debatesStarted: allDebates.length,
      debatesCompleted: allDebates.filter((d) => d.status === "completed").length,
      debates7d: allDebates.filter((d) => now - new Date(d.created_at).getTime() < 7 * day).length,
      quick: allDebates.filter((d) => d.mode === "quick").length,
      unlimited: allDebates.filter((d) => d.mode === "unlimited").length,
    },
    perDay,
    byCharacter,
    leagues: {
      bronze: allProfiles.filter((p) => p.league === "bronze").length,
      silver: allProfiles.filter((p) => p.league === "silver").length,
      gold: allProfiles.filter((p) => p.league === "gold").length,
    },
    profiles: allProfiles.map((p) => ({ ...p, debates_started: startedByUser.get(p.id) ?? 0 })),
  };
});
