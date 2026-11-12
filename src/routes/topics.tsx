import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CATEGORIES, DIFFICULTY_LABEL, TOPICS } from "@/lib/topics";
import { PageHeader } from "@/components/voxora/ui";
import { cn } from "@/lib/utils";

type TopicsSearch = { category?: string };

export const Route = createFileRoute("/topics")({
  validateSearch: (search: Record<string, unknown>): TopicsSearch => {
    const c = typeof search["category"] === "string" ? search["category"] : undefined;
    return c && (CATEGORIES as readonly string[]).includes(c) ? { category: c } : {};
  },
  head: () => ({
    meta: [
      { title: "Debate Topics – Voxora" },
      { name: "description", content: "30 debate topics across technology, education, science, environment, ethics and more — or bring your own." },
      { property: "og:title", content: "Debate Topics – Voxora" },
      { property: "og:description", content: "30 debate topics in 10 categories, plus your own custom topics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Topics,
});

const DIFF_TONE = { easy: "text-success border-success/40", medium: "text-warning border-warning/40", hard: "text-against border-against/40" } as const;

function Topics() {
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/topics" });
  const list = category ? TOPICS.filter((t) => t.category === category) : TOPICS;

  return (
    <div>
      <PageHeader
        eyebrow="Topics"
        title={<>Pick your <span className="text-gradient-brand">battleground</span></>}
        description="Choose a ready-made motion or write your own."
        actions={
          <Button asChild variant="hero" className="rounded-full">
            <Link to="/arena" search={{ custom: true }}>
              <PenLine /> Custom topic
            </Link>
          </Button>
        }
      />

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {[undefined, ...CATEGORIES].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            onClick={() => navigate({ search: c ? { category: c } : {} })}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition",
              category === c ? "border-transparent bg-nav-active text-primary-foreground" : "border-glass-border bg-secondary/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {c ?? "All"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <Link
            key={t.id}
            to="/arena"
            search={{ topic: t.id }}
            className="glass group flex flex-col gap-3 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neon-cyan">{t.category}</span>
              <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", DIFF_TONE[t.suggested])}>
                {DIFFICULTY_LABEL[t.suggested]}
              </span>
            </div>
            <h3 className="text-lg font-bold leading-snug">{t.title}</h3>
            <p className="text-sm text-muted-foreground">{t.description}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-neon-cyan transition group-hover:gap-2">
              Debate this <ArrowRight className="size-4" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
