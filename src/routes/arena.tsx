import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Infinity as InfinityIcon, Loader2, PenLine, Swords, Timer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHARACTERS, getCharacter, type CharacterId } from "@/lib/characters";
import { CHARACTER_AVATARS } from "@/lib/character-avatars";
import {
  CATEGORIES,
  DIFFICULTY_HINT,
  DIFFICULTY_LABEL,
  QUICK_ROUNDS,
  TOPICS,
  type DebateMode,
  type Difficulty,
  type Position,
} from "@/lib/topics";
import { PageHeader } from "@/components/voxora/ui";
import { ProfileGate } from "@/components/voxora/profile-gate";
import { useVoxora } from "@/hooks/use-voxora";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ArenaSearch = { opponent?: CharacterId; topic?: string; custom?: boolean };

export const Route = createFileRoute("/arena")({
  validateSearch: (search: Record<string, unknown>): ArenaSearch => {
    const out: ArenaSearch = {};
    if (typeof search.opponent === "string" && getCharacter(search.opponent)) out.opponent = search.opponent as CharacterId;
    if (typeof search.topic === "string" && TOPICS.some((t) => t.id === search.topic)) out.topic = search.topic;
    if (search.custom === true || search.custom === "true") out.custom = true;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Create a Debate – Voxora" },
      { name: "description", content: "Choose your AI opponent, topic, side, difficulty and mode, then step into the arena." },
      { property: "og:title", content: "Create a Debate – Voxora" },
      { property: "og:description", content: "Set up a debate against an AI opponent in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Arena,
});

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-3xl p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-neon font-mono text-sm text-primary-foreground">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative rounded-2xl border p-4 text-left transition",
        active ? "border-primary bg-primary/15 glow" : "border-glass-border bg-secondary/30 hover:border-primary/40",
        className,
      )}
    >
      {active && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" />
        </span>
      )}
      {children}
    </button>
  );
}

function Arena() {
  return (
    <div>
      <PageHeader
        eyebrow="Create Debate"
        title={<>Set up the <span className="text-gradient-brand">arena</span></>}
        description="Your opponent will always argue the opposite side."
      />
      <ProfileGate reason="Your debates, scores and league are saved to your profile.">
        <ArenaForm />
      </ProfileGate>
    </div>
  );
}

function ArenaForm() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { userId } = useVoxora();

  const [opponent, setOpponent] = useState<CharacterId>(search.opponent ?? "strategist");
  const [isCustom, setIsCustom] = useState(!!search.custom);
  const [topicId, setTopicId] = useState<string>(search.topic ?? TOPICS[0]!.id);
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [position, setPosition] = useState<Position>("for");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => TOPICS.find((t) => t.id === (search.topic ?? ""))?.suggested ?? "medium",
  );
  const [mode, setMode] = useState<DebateMode>("quick");
  const [starting, setStarting] = useState(false);

  const topic = TOPICS.find((t) => t.id === topicId)!;
  const character = getCharacter(opponent)!;

  async function start() {
    if (!userId) return;
    const title = isCustom ? customTitle.trim() : topic.title;
    if (title.length < 3) {
      toast.error("Write a topic of at least 3 characters.");
      return;
    }
    setStarting(true);
    const { data, error } = await supabase
      .from("debates")
      .insert({
        user_id: userId,
        character_id: opponent,
        topic: title.slice(0, 300),
        topic_description: isCustom ? customDesc.trim().slice(0, 600) || null : topic.description,
        category: isCustom ? "Custom" : topic.category,
        is_custom: isCustom,
        position,
        difficulty,
        mode,
      })
      .select("id")
      .single();
    if (error || !data) {
      setStarting(false);
      toast.error("Couldn't start the debate. Please try again.");
      return;
    }
    navigate({ to: "/debate/$id", params: { id: data.id } });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Step n={1} title="Choose your opponent">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CHARACTERS.map((c) => (
              <Choice key={c.id} active={opponent === c.id} onClick={() => setOpponent(c.id)} className="flex items-center gap-3 p-3">
                <img src={CHARACTER_AVATARS[c.id]} alt="" width={512} height={512} className="size-12 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 pr-4">
                  <div className={cn("truncate text-sm font-bold", c.accentClass)}>{c.name.replace("The ", "")}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{c.personality.slice(0, 2).join(" · ")}</div>
                </div>
              </Choice>
            ))}
          </div>
        </Step>

        <Step n={2} title="Pick a topic">
          <div className="mb-4 inline-flex rounded-full border border-glass-border bg-secondary/40 p-1">
            <button type="button" onClick={() => setIsCustom(false)} className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition", !isCustom ? "bg-nav-active text-primary-foreground" : "text-muted-foreground")}>
              Ready-made
            </button>
            <button type="button" onClick={() => setIsCustom(true)} className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition", isCustom ? "bg-nav-active text-primary-foreground" : "text-muted-foreground")}>
              <PenLine className="size-3.5" /> Custom
            </button>
          </div>
          {isCustom ? (
            <div className="space-y-3">
              <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} maxLength={200} placeholder="e.g. Pineapple belongs on pizza" className="h-11 bg-secondary/40" />
              <Textarea value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} maxLength={500} placeholder="Optional context for your opponent" className="min-h-20 bg-secondary/40" />
            </div>
          ) : (
            <div className="space-y-3">
              <Select
                value={topicId}
                onValueChange={(v) => {
                  setTopicId(v);
                  const t = TOPICS.find((x) => x.id === v);
                  if (t) setDifficulty(t.suggested);
                }}
              >
                <SelectTrigger className="h-11 bg-secondary/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {CATEGORIES.map((cat) => (
                    <SelectGroup key={cat}>
                      <SelectLabel className="text-neon-cyan">{cat}</SelectLabel>
                      {TOPICS.filter((t) => t.category === cat).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{topic.description}</p>
            </div>
          )}
        </Step>

        <Step n={3} title="Choose your side">
          <div className="grid grid-cols-2 gap-3">
            <Choice active={position === "for"} onClick={() => setPosition("for")}>
              <div className="text-lg font-extrabold text-for">FOR</div>
              <div className="text-xs text-muted-foreground">You support the motion</div>
            </Choice>
            <Choice active={position === "against"} onClick={() => setPosition("against")}>
              <div className="text-lg font-extrabold text-against">AGAINST</div>
              <div className="text-xs text-muted-foreground">You oppose the motion</div>
            </Choice>
          </div>
        </Step>

        <Step n={4} title="Difficulty">
          <div className="grid gap-3 sm:grid-cols-3">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <Choice key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                <div className="font-bold">{DIFFICULTY_LABEL[d]}</div>
                <div className="mt-1 text-xs text-muted-foreground">{DIFFICULTY_HINT[d]}</div>
              </Choice>
            ))}
          </div>
        </Step>

        <Step n={5} title="Mode">
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice active={mode === "quick"} onClick={() => setMode("quick")}>
              <div className="flex items-center gap-2 font-bold"><Timer className="size-4 text-neon-cyan" /> Quick Debate</div>
              <div className="mt-1 text-xs text-muted-foreground">{QUICK_ROUNDS} rounds, then the judge scores you.</div>
            </Choice>
            <Choice active={mode === "unlimited"} onClick={() => setMode("unlimited")}>
              <div className="flex items-center gap-2 font-bold"><InfinityIcon className="size-4 text-neon-violet" /> Unlimited Debate</div>
              <div className="mt-1 text-xs text-muted-foreground">Keep going as long as you like. End when you're ready.</div>
            </Choice>
          </div>
        </Step>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="glass-strong neon-border overflow-hidden rounded-3xl">
          <img src={CHARACTER_AVATARS[opponent]} alt={character.name} width={512} height={512} className="aspect-[4/3] w-full object-cover object-top" />
          <div className="space-y-4 p-5">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Your opponent</div>
              <div className={cn("text-xl font-extrabold italic", character.accentClass)}>{character.name}</div>
              <p className="text-sm text-muted-foreground">“{character.tagline}”</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Topic</dt><dd className="text-right font-medium">{isCustom ? customTitle || "—" : topic.title}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">You argue</dt><dd className={cn("font-bold uppercase", position === "for" ? "text-for" : "text-against")}>{position}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Difficulty</dt><dd className="font-medium">{DIFFICULTY_LABEL[difficulty]}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Mode</dt><dd className="font-medium">{mode === "quick" ? `Quick · ${QUICK_ROUNDS} rounds` : "Unlimited"}</dd></div>
            </dl>
            <Button variant="hero" size="xl" className="w-full rounded-full" onClick={start} disabled={starting}>
              {starting ? <Loader2 className="animate-spin" /> : <Swords />} Enter the arena
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
