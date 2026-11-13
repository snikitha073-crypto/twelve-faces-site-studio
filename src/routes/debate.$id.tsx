import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowLeft, Flag, Gavel, Loader2, SendHorizontal, Square, Timer, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { CharacterAvatar, UserAvatar } from "@/components/voxora/avatars";
import { SideBadge } from "@/components/voxora/ui";
import { EvaluationReport } from "@/components/voxora/evaluation-report";
import { useVoxora, type DebateRow } from "@/hooks/use-voxora";
import { supabase } from "@/integrations/supabase/client";
import { getCharacter, type Character } from "@/lib/characters";
import { endDebate } from "@/lib/debate.functions";
import { evaluationSchema } from "@/lib/evaluation";
import { formatClock, formatDate, formatDuration } from "@/lib/format";
import { LEAGUE_LABEL, LEAGUES, type League } from "@/lib/league";
import { DIFFICULTY_LABEL, QUICK_ROUNDS, opposite, type Difficulty, type Position } from "@/lib/topics";
import { speak, speechSupported, stopSpeaking } from "@/lib/voice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/debate/$id")({
  head: () => ({
    meta: [
      { title: "Debate – Voxora" },
      { name: "description", content: "A live debate against an AI opponent on Voxora." },
      { property: "og:title", content: "Debate – Voxora" },
      { property: "og:description", content: "A live debate against an AI opponent on Voxora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DebatePage,
});

function textOf(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function readError(err: Error | undefined): string | null {
  if (!err) return null;
  try {
    const parsed = JSON.parse(err.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    // not JSON
  }
  return err.message || "Something went wrong. Please try again.";
}

function debateQuery(id: string, userId: string | null) {
  return {
    queryKey: ["debate", id, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("debates").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  };
}

function DebatePage() {
  const { id } = Route.useParams();
  const { ready, userId } = useVoxora();
  const query = useQuery(debateQuery(id, userId));

  if (!ready || (userId && query.isLoading)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-[60vh] w-full rounded-3xl" />
      </div>
    );
  }
  const debate = query.data;
  const character = debate ? getCharacter(debate.character_id) : undefined;
  if (!debate || !character) {
    return (
      <div className="glass mx-auto max-w-lg rounded-3xl p-8 text-center">
        <h1 className="text-xl font-bold">Debate not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may belong to another browser profile, or the link is wrong.</p>
        <Button asChild variant="hero" className="mt-6 rounded-full">
          <Link to="/arena" search={{}}>Start a new debate</Link>
        </Button>
      </div>
    );
  }
  return debate.status === "completed" ? (
    <CompletedDebate debate={debate} character={character} />
  ) : (
    <LiveDebate key={debate.id} debate={debate} character={character} />
  );
}

function DebateHeader({ debate, character, right }: { debate: DebateRow; character: Character; right?: React.ReactNode }) {
  const userSide = debate.position as Position;
  return (
    <div className="glass-strong neon-border flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <CharacterAvatar id={character.id} size="md" />
        <div className="min-w-0">
          <div className={cn("text-sm font-bold", character.accentClass)}>vs {character.name}</div>
          <h1 className="text-lg font-extrabold leading-tight sm:text-xl">{debate.topic}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <SideBadge side={userSide} label={`You: ${userSide}`} />
            <SideBadge side={opposite(userSide)} label={`AI: ${opposite(userSide)}`} />
            <span>{DIFFICULTY_LABEL[debate.difficulty as Difficulty]}</span>
            <span>·</span>
            <span>{debate.mode === "quick" ? `Quick · ${QUICK_ROUNDS} rounds` : "Unlimited"}</span>
          </div>
        </div>
      </div>
      {right}
    </div>
  );
}

function Bubble({
  message,
  character,
  speaking,
  onSpeak,
}: {
  message: UIMessage;
  character: Character;
  speaking: boolean;
  onSpeak?: () => void;
}) {
  const { profile } = useVoxora();
  const mine = message.role === "user";
  const text = textOf(message);
  return (
    <div className={cn("flex gap-3", mine && "flex-row-reverse")}>
      {mine ? <UserAvatar value={profile?.avatar_url} name={profile?.display_name} size="sm" /> : <CharacterAvatar id={character.id} size="sm" />}
      <div className={cn("max-w-[85%] space-y-1 sm:max-w-[75%]", mine && "items-end text-right")}>
        <div className={cn("flex items-center gap-2 text-xs font-semibold", mine ? "justify-end text-muted-foreground" : character.accentClass)}>
          {mine ? "You" : character.name}
          {!mine && onSpeak && text && (
            <button type="button" onClick={onSpeak} className="rounded-full p-1 text-muted-foreground transition hover:text-foreground" aria-label={speaking ? "Stop voice" : "Play voice"}>
              {speaking ? <Square className="size-3.5" /> : <Volume2 className="size-3.5" />}
            </button>
          )}
        </div>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-4 py-3 text-left text-[15px] leading-relaxed",
            mine ? "rounded-tr-sm bg-nav-active text-primary-foreground" : "glass rounded-tl-sm",
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function useElapsed(since: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now == null ? 0 : (now - new Date(since).getTime()) / 1000;
}

function LiveDebate({ debate, character }: { debate: DebateRow; character: Character }) {
  const queryClient = useQueryClient();
  const endDebateFn = useServerFn(endDebate);
  const [input, setInput] = useState("");
  const [ending, setEnding] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  const autoVoiceRef = useRef(false);
  const elapsed = useElapsed(debate.created_at);

  useEffect(() => {
    setCanSpeak(speechSupported());
    const saved = window.localStorage.getItem("voxora_voice") === "on";
    setAutoVoice(saved);
    autoVoiceRef.current = saved;
    return () => stopSpeaking();
  }, []);

  const initialMessages = useMemo(
    () => (Array.isArray(debate.messages) ? (debate.messages as unknown as UIMessage[]) : []),
    [debate.messages],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/debate-chat",
        prepareSendMessagesRequest: async ({ messages }) => {
          const { data } = await supabase.auth.getSession();
          const last = messages[messages.length - 1]!;
          return {
            body: { debateId: debate.id, message: { id: last.id, text: textOf(last) } },
            headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
          };
        },
      }),
    [debate.id],
  );

  const { messages, sendMessage, status, error, setMessages, stop, clearError } = useChat({
    id: debate.id,
    messages: initialMessages,
    transport,
    onFinish: ({ message, isError, isAbort }) => {
      if (isError || isAbort) return;
      void queryClient.invalidateQueries({ queryKey: ["debates"] });
      const text = textOf(message);
      if (autoVoiceRef.current && text) {
        setSpeakingId(message.id);
        speak(text, character.voice, () => setSpeakingId(null));
      }
    },
    onError: () => {
      // Roll back the unsent argument so it can be retried; nothing was saved on the server.
      setMessages((prev) => {
        const lastUser = prev.map((m) => m.role).lastIndexOf("user");
        if (lastUser < 0) return prev;
        const hasReply = prev.slice(lastUser + 1).some((m) => m.role === "assistant" && textOf(m).trim());
        if (hasReply) return prev;
        setInput((cur) => cur || textOf(prev[lastUser]!));
        return prev.slice(0, lastUser);
      });
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const rounds = messages.filter((m) => m.role === "assistant" && textOf(m).trim()).length;
  const userTurns = messages.filter((m) => m.role === "user").length;
  const quickDone = debate.mode === "quick" && rounds >= QUICK_ROUNDS;
  const errorText = readError(error);

  function send() {
    const text = input.trim();
    if (!text || busy || quickDone) return;
    if (text.length > 2000) {
      toast.error("Keep each argument under 2000 characters.");
      return;
    }
    clearError();
    stopSpeaking();
    setSpeakingId(null);
    setInput("");
    void sendMessage({ text });
  }

  function toggleAutoVoice() {
    const next = !autoVoice;
    setAutoVoice(next);
    autoVoiceRef.current = next;
    window.localStorage.setItem("voxora_voice", next ? "on" : "off");
    if (!next) {
      stopSpeaking();
      setSpeakingId(null);
    }
  }

  function toggleSpeak(m: UIMessage) {
    if (speakingId === m.id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(m.id);
    speak(textOf(m), character.voice, () => setSpeakingId((cur) => (cur === m.id ? null : cur)));
  }

  async function finish() {
    if (busy) stop();
    stopSpeaking();
    setEnding(true);
    try {
      const result = await endDebateFn({ data: { debateId: debate.id } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (!result.alreadyCompleted && result.league && result.previousLeague && result.league !== result.previousLeague) {
        const up = LEAGUES.indexOf(result.league as League) > LEAGUES.indexOf(result.previousLeague as League);
        toast.success(up ? `Promoted to ${LEAGUE_LABEL[result.league as League]} league!` : `You dropped to ${LEAGUE_LABEL[result.league as League]} league.`);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["debate", debate.id] }),
        queryClient.invalidateQueries({ queryKey: ["debates"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the judge. Please try again.");
    } finally {
      setEnding(false);
    }
  }

  const roundLabel = debate.mode === "quick" ? `Round ${Math.min(rounds + (quickDone ? 0 : 1), QUICK_ROUNDS)}/${QUICK_ROUNDS}` : `Round ${rounds + 1}`;

  return (
    <div className="flex flex-col gap-4">
      <DebateHeader
        debate={debate}
        character={character}
        right={
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-secondary/50 px-3 py-1.5 font-mono text-sm">
              <Timer className="size-4 text-neon-cyan" /> {formatClock(elapsed)}
            </span>
            <span className="rounded-full border border-glass-border bg-secondary/50 px-3 py-1.5 font-mono text-sm">{roundLabel}</span>
            {canSpeak && (
              <Button variant="glass" size="icon" onClick={toggleAutoVoice} aria-label={autoVoice ? "Turn opponent voice off" : "Turn opponent voice on"} title={autoVoice ? "Voice on" : "Voice off"}>
                {autoVoice ? <Volume2 className="text-neon-cyan" /> : <VolumeX />}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="neon" disabled={ending || userTurns === 0} className="rounded-full">
                  {ending ? <Loader2 className="animate-spin" /> : <Flag />} End debate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End the debate and get judged?</AlertDialogTitle>
                  <AlertDialogDescription>The judge will score everything you've argued so far. You can't add more arguments afterwards.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep debating</AlertDialogCancel>
                  <AlertDialogAction onClick={finish}>End & evaluate</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="glass relative flex h-[calc(100dvh-20rem)] min-h-[420px] flex-col overflow-hidden rounded-3xl lg:h-[calc(100dvh-17rem)]">
        {ending && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
            <Gavel className="size-10 animate-pulse text-neon-violet" />
            <Shimmer className="text-lg font-semibold">The judge is reviewing your debate…</Shimmer>
          </div>
        )}
        <Conversation className="flex-1">
          <ConversationContent className="gap-5 p-4 sm:p-6">
            {messages.length === 0 && (
              <div className="mx-auto my-10 max-w-md text-center">
                <CharacterAvatar id={character.id} size="xl" className="mx-auto" />
                <p className={cn("mt-4 font-bold", character.accentClass)}>{character.name} is ready.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You argue <strong className="uppercase text-foreground">{debate.position}</strong> the motion. Make your opening argument — your opponent will take the other side.
                </p>
              </div>
            )}
            {messages.map((m) => (
              <Bubble
                key={m.id}
                message={m}
                character={character}
                speaking={speakingId === m.id}
                {...(canSpeak && m.role === "assistant" ? { onSpeak: () => toggleSpeak(m) } : {})}
              />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-3">
                <CharacterAvatar id={character.id} size="sm" />
                <Shimmer className="text-sm">{`${character.name} is preparing a rebuttal…`}</Shimmer>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-glass-border bg-background/40 p-3 sm:p-4">
          {errorText && (
            <div role="alert" className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
              {errorText}
            </div>
          )}
          {quickDone ? (
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 sm:flex-row">
              <div>
                <div className="font-bold">All {QUICK_ROUNDS} rounds are done.</div>
                <div className="text-sm text-muted-foreground">Time to hear the judge's verdict.</div>
              </div>
              <Button variant="hero" className="rounded-full" onClick={finish} disabled={ending}>
                {ending ? <Loader2 className="animate-spin" /> : <Gavel />} Get my evaluation
              </Button>
            </div>
          ) : (
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                maxLength={2000}
                rows={2}
                disabled={ending}
                placeholder={userTurns === 0 ? "Make your opening argument…" : `Answer ${character.name.replace("The ", "the ")}…`}
                aria-label="Your argument"
                className="max-h-40 min-h-12 resize-none bg-secondary/40"
              />
              {busy ? (
                <Button type="button" variant="glass" size="icon" onClick={() => stop()} aria-label="Stop reply" className="size-12 shrink-0 rounded-2xl">
                  <Square />
                </Button>
              ) : (
                <Button type="submit" variant="hero" size="icon" disabled={!input.trim() || ending} aria-label="Send argument" className="size-12 shrink-0 rounded-2xl">
                  <SendHorizontal />
                </Button>
              )}
            </form>
          )}
          {!quickDone && <p className="mt-2 hidden text-xs text-muted-foreground sm:block">Enter to send · Shift + Enter for a new line</p>}
        </div>
      </div>
    </div>
  );
}

function CompletedDebate({ debate, character }: { debate: DebateRow; character: Character }) {
  const parsed = evaluationSchema.safeParse(debate.evaluation);
  const messages = Array.isArray(debate.messages) ? (debate.messages as unknown as UIMessage[]) : [];
  const [showTranscript, setShowTranscript] = useState(false);
  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link to="/history">
          <ArrowLeft /> Debate history
        </Link>
      </Button>
      <DebateHeader
        debate={debate}
        character={character}
        right={
          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:items-end">
            <span>{formatDate(debate.completed_at)}</span>
            <span>
              {debate.rounds_completed} round{debate.rounds_completed === 1 ? "" : "s"} · {formatDuration(debate.duration_seconds)}
            </span>
          </div>
        }
      />
      {parsed.success ? (
        <EvaluationReport evaluation={parsed.data} points={debate.points_awarded} />
      ) : (
        <div className="glass rounded-2xl p-6 text-muted-foreground">This debate has no report.</div>
      )}
      <div className="glass rounded-2xl p-5">
        <button type="button" className="flex w-full items-center justify-between font-bold" onClick={() => setShowTranscript((v) => !v)} aria-expanded={showTranscript}>
          Full transcript
          <span className="text-sm font-normal text-muted-foreground">{showTranscript ? "Hide" : `Show ${messages.length} messages`}</span>
        </button>
        {showTranscript && (
          <div className="mt-5 space-y-5">
            {messages.map((m) => (
              <Bubble key={m.id} message={m} character={character} speaking={false} />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="hero" className="rounded-full">
          <Link to="/arena" search={{ opponent: character.id }}>
            Rematch {character.name.replace("The ", "")}
          </Link>
        </Button>
        <Button asChild variant="glass" className="rounded-full">
          <Link to="/progress">See your progress</Link>
        </Button>
      </div>
    </div>
  );
}
