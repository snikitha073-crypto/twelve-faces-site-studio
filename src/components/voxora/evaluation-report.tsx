import { Award, Lightbulb, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/format";
import type { Evaluation } from "@/lib/evaluation";

const CATEGORIES: { key: keyof Evaluation; label: string }[] = [
  { key: "argument_quality", label: "Argument quality" },
  { key: "logical_reasoning", label: "Logical reasoning" },
  { key: "relevance", label: "Relevance" },
  { key: "persuasiveness", label: "Persuasiveness" },
  { key: "evidence", label: "Evidence & examples" },
];

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <defs>
          <linearGradient id="score-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--neon-violet)" />
            <stop offset="100%" stopColor="var(--neon-cyan)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--secondary)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#score-grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-mono text-4xl font-bold", scoreTone(score))}>{score}</span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

function ListBlock({ title, items, icon, tone }: { title: string; items: string[]; icon: React.ReactNode; tone: string }) {
  if (!items.length) return null;
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className={cn("mb-3 flex items-center gap-2 font-bold", tone)}>
        {icon} {title}
      </h3>
      <ul className="space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className={cn("mt-2 size-1.5 shrink-0 rounded-full bg-current", tone)} />
            <span className="text-foreground/90">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EvaluationReport({ evaluation, points }: { evaluation: Evaluation; points: number | null }) {
  return (
    <div className="space-y-5">
      <div className="glass-strong neon-border flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
        <ScoreRing score={evaluation.overall_score} />
        <div className="flex-1 text-center sm:text-left">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-neon-cyan">Judge's verdict</div>
          <h2 className="mt-1 text-2xl font-extrabold italic sm:text-3xl">{evaluation.verdict || "Debate complete"}</h2>
          {evaluation.summary && <p className="mt-2 text-muted-foreground">{evaluation.summary}</p>}
          {points != null && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Award className="size-4" /> +{points} league points
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="mb-4 font-bold">Score breakdown</h3>
        <div className="space-y-3">
          {CATEGORIES.map(({ key, label }) => {
            const value = evaluation[key] as number;
            return (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono font-semibold">{value}/10</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-gradient-neon" style={{ width: `${value * 10}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ListBlock title="Strengths" items={evaluation.strengths} icon={<ThumbsUp className="size-4" />} tone="text-success" />
        <ListBlock title="Weaknesses" items={evaluation.weaknesses} icon={<ThumbsDown className="size-4" />} tone="text-against" />
      </div>
      <ListBlock title="How to improve" items={evaluation.improvements} icon={<Lightbulb className="size-4" />} tone="text-warning" />
      {evaluation.best_moment && (
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-neon-cyan">
            <Sparkles className="size-4" /> Your best moment
          </h3>
          <p className="text-sm italic text-foreground/90">“{evaluation.best_moment}”</p>
        </div>
      )}
    </div>
  );
}
