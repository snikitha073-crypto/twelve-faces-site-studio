import { createFileRoute } from "@tanstack/react-router";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

import { verifyBearer } from "@/lib/auth.server";
import { createLovableAiGatewayProvider, withLovableAiGatewayRunIdHeader } from "@/lib/ai/gateway.server";
import { aiErrorMessage } from "@/lib/ai/errors";
import { getCharacter } from "@/lib/characters";
import { buildDebateInstructions } from "@/lib/debate-prompt";
import { QUICK_ROUNDS, type DebateMode, type Difficulty, type Position } from "@/lib/topics";

const DEBATE_MODEL = "google/gemini-3.8-flash";

const bodySchema = z.object({
  debateId: z.string().uuid(),
  message: z.object({
    id: z.string().min(1).max(100),
    text: z.string().trim().min(1, "Write an argument first.").max(2000, "Keep each argument under 2000 characters."),
  }),
});

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function handle(request: Request) {
  const auth = await verifyBearer(request);
  if (!auth) return jsonError(401, "Your session expired. Refresh the page and try again.");

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? (err.issues[0]?.message ?? "Invalid request") : "Invalid request";
    return jsonError(400, msg);
  }

  // RLS: the user's own client can only read the user's own debates.
  const { data: debate, error } = await auth.supabase
    .from("debates")
    .select("*")
    .eq("id", parsed.debateId)
    .maybeSingle();
  if (error) return jsonError(500, "Couldn't load this debate.");
  if (!debate) return jsonError(404, "Debate not found.");
  if (debate.status !== "active") return jsonError(409, "This debate has already ended.");
  if (debate.mode === "quick" && debate.rounds_completed >= QUICK_ROUNDS) {
    return jsonError(409, "All 3 rounds are done. End the debate to get your evaluation.");
  }

  const character = getCharacter(debate.character_id);
  if (!character) return jsonError(500, "Unknown opponent.");

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return jsonError(500, "AI is not configured for this app.");

  // History comes from the server copy, never from the client.
  const history = (Array.isArray(debate.messages) ? debate.messages : []) as unknown as UIMessage[];
  const userMessage: UIMessage = {
    id: parsed.message.id,
    role: "user",
    parts: [{ type: "text", text: parsed.message.text }],
  };
  const allMessages = [...history, userMessage];
  const round = debate.rounds_completed + 1;

  const gateway = createLovableAiGatewayProvider(apiKey, undefined, {
    baseURL: "https://ai.gateway.lovable.dev/v1",
  });

  const instructions = buildDebateInstructions(
    {
      character,
      topic: debate.topic,
      topicDescription: debate.topic_description,
      userPosition: debate.position as Position,
      difficulty: debate.difficulty as Difficulty,
      mode: debate.mode as DebateMode,
      round,
    },
    history,
  );

  const result = streamText({
    model: gateway(DEBATE_MODEL),
    instructions,
    messages: await convertToModelMessages(allMessages),
    abortSignal: request.signal,
  });

  const response = result.toUIMessageStreamResponse({
    originalMessages: allMessages,
    onError: (err) => {
      console.error("debate-chat stream error", err);
      return aiErrorMessage(err).message;
    },
    onFinish: async ({ messages, isAborted }) => {
      if (isAborted) return;
      const last = messages[messages.length - 1];
      const hasReply = last?.role === "assistant" && last.parts.some((p) => p.type === "text" && p.text.trim());
      if (!hasReply) return;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: saveError } = await supabaseAdmin
        .from("debates")
        .update({ messages: messages as never, rounds_completed: round })
        .eq("id", debate.id)
        .eq("user_id", auth.userId)
        .eq("status", "active");
      if (saveError) console.error("Failed to save debate turn", saveError);
    },
  });

  return withLovableAiGatewayRunIdHeader(response, gateway, { "cache-control": "no-store" });
}

export const Route = createFileRoute("/api/debate-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          return await handle(request);
        } catch (err) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          console.error("debate-chat failed", err);
          const { status, message } = aiErrorMessage(err);
          return jsonError(status, message);
        }
      },
    },
  },
});
