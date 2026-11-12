import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DebateRow = Database["public"]["Tables"]["debates"]["Row"];

interface VoxoraContextValue {
  ready: boolean;
  session: Session | null;
  userId: string | null;
  profile: Profile | null;
  profileLoading: boolean;
  /** Returns a user id, creating a private no-password guest session if needed. */
  ensureSession: () => Promise<string>;
  refreshProfile: () => Promise<void>;
}

const VoxoraContext = createContext<VoxoraContextValue | null>(null);

export function VoxoraProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        setSession(next);
        return;
      }
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(next);
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const profile = profileQuery.data ?? null;

  // Presence heartbeat (used for the owner's "active now" count).
  useEffect(() => {
    if (!profile) return;
    const ping = () => void supabase.rpc("touch_presence");
    ping();
    const t = setInterval(ping, 60_000);
    return () => clearInterval(t);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session.user.id;
    const { data: created, error } = await supabase.auth.signInAnonymously();
    if (error || !created.user) throw new Error(error?.message ?? "Couldn't start your session");
    setSession(created.session);
    return created.user.id;
  }, []);

  const refreshProfile = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  }, [queryClient]);

  const value = useMemo<VoxoraContextValue>(
    () => ({
      ready,
      session,
      userId,
      profile,
      profileLoading: !ready || (!!userId && profileQuery.isLoading),
      ensureSession,
      refreshProfile,
    }),
    [ready, session, userId, profile, profileQuery.isLoading, ensureSession, refreshProfile],
  );

  return <VoxoraContext.Provider value={value}>{children}</VoxoraContext.Provider>;
}

export function useVoxora() {
  const ctx = useContext(VoxoraContext);
  if (!ctx) throw new Error("useVoxora must be used inside VoxoraProvider");
  return ctx;
}

export function useMyDebates(limit = 50) {
  const { userId } = useVoxora();
  return useQuery({
    queryKey: ["debates", userId, limit],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("debates")
        .select("id, character_id, topic, category, position, difficulty, mode, status, score, points_awarded, rounds_completed, created_at, completed_at, duration_seconds")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export type LeaderboardRow = Database["public"]["Functions"]["get_leaderboard"]["Returns"][number];

export function useLeaderboard(league: "bronze" | "silver" | "gold", limit = 50) {
  return useQuery({
    queryKey: ["leaderboard", league, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", { _league: league, _limit: limit });
      if (error) throw error;
      return data ?? [];
    },
  });
}
