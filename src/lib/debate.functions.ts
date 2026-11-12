import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { UIMessage } from "ai";

import { getCharacter } from "./characters";
import { buildEvaluationPrompt, buildTranscript } from "./debate-prompt";
import { parseEvaluation } from "./evaluation";
import { computeLeague, pointsForDebate, recentAverage, type League } from "./league";
import type { DebateMode, Difficulty, Position } from "./topics";

const EVAL_MODEL = "google/gemini-3.8-flash";

export const endDebate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { debateId: string }) => z.object({ debateId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: debate, error } = await supabase.from("debates").select("*").eq("id", data.debateId).maybeSingle();
    if (error || !debate) return { ok: false as const, error: "Debate not found." };
    if (debate.status === "completed") return { ok: true as const, alreadyCompleted: true };

    const messages = (Array.isArray(debate.messages) ? debate.messages : []) as unknown as UIMessage[];
    const userTurns = messages.filter((m) => m.role === "user").length;
    if (userTurns === 0) return { ok: false as const, error: "Make at least one argument before ending the debate." };

    const character = getCharacter(debate.character_id);
    if (!character) return { ok: false as const, error: "Unknown opponent." };

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!profile) return { ok: false as const, error: "Create your profile first." };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "AI is not configured for this app." };

    const { createLovableAiGatewayProvider } = await import("./ai/gateway.server");
    const { streamText } = await import("ai");
    const { aiErrorMessage } = await import("./ai/errors");

    const transcript = buildTranscript(messages, profile.display_name, character.name);
    const prompt = buildEvaluationPrompt(
      {
        character,
        topic: debate.topic,
        topicDescription: debate.topic_description,
        userPosition: debate.position as Position,
        difficulty: debate.difficulty as Difficulty,
        mode: debate.mode as DebateMode,
      },
      transcript,
      userTurns,
    );

    let text = "";
    try {
      const gateway = createLovableAiGatewayProvider(apiKey, undefined, { baseURL: "https://ai.gateway.lovable.dev/v1" });
      const result = streamText({ model: gateway(EVAL_MODEL), prompt });
      text = await result.text;
    } catch (err) {
      console.error("evaluation failed", err);
      return { ok: false as const, error: aiErrorMessage(err).message };
    }

    const evaluation = parseEvaluation(text);
    if (!evaluation) {
      console.error("evaluation parse failed", text.slice(0, 500));
      return { ok: false as const, error: "The judge's report came back unreadable. Please try ending the debate again." };
    }

    const score = evaluation.overall_score;
    const points = pointsForDebate(score, debate.difficulty as Difficulty);
    const duration = Math.max(0, Math.round((Date.now() - new Date(debate.created_at).getTime()) / 1000));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("debates")
      .update({
        status: "completed",
        evaluation: evaluation as never,
        score,
        points_awarded: points,
        duration_seconds: duration,
        completed_at: new Date().toISOString(),
      })
      .eq("id", debate.id)
      .eq("user_id", userId)
      .eq("status", "active")
      .select("id");
    if (updateError) return { ok: false as const, error: "Couldn't save your evaluation." };
    if (!updated?.length) return { ok: true as const, alreadyCompleted: true };

    // Recompute stats + league from all completed debates (server-side only).
    const { data: completed } = await supabaseAdmin
      .from("debates")
      .select("score, points_awarded, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });
    const scores = (completed ?? []).map((d) => d.score ?? 0);
    const totalPoints = (completed ?? []).reduce((a, d) => a + (d.points_awarded ?? 0), 0);
    const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
    const recent = recentAverage(scores);
    const previousLeague = profile.league as League;
    const league = computeLeague(previousLeague, scores.length, recent);

    await supabaseAdmin
      .from("profiles")
      .update({
        debates_completed: scores.length,
        points: totalPoints,
        avg_score: avg,
        recent_avg_score: recent,
        league,
      })
      .eq("id", userId);

    return { ok: true as const, alreadyCompleted: false, score, points, league, previousLeague };
  });
