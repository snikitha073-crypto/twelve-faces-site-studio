import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic2, Swords } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CHARACTERS } from "@/lib/characters";
import { CHARACTER_AVATARS } from "@/lib/character-avatars";
import { PageHeader } from "@/components/voxora/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/opponents")({
  head: () => ({
    meta: [
      { title: "AI Opponents – Voxora" },
      { name: "description", content: "Meet the Strategist, Scientist, Skeptic, Futurist, Ethicist and Creative — six AI debaters with their own voice and style." },
      { property: "og:title", content: "AI Opponents – Voxora" },
      { property: "og:description", content: "Six AI debaters, each with their own personality, style and voice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Opponents,
});

function Opponents() {
  return (
    <div>
      <PageHeader
        eyebrow="AI Opponents"
        title={<>Know your <span className="text-gradient-brand">rival</span></>}
        description="Every opponent always argues the side you didn't pick. Their personality shapes how they attack your case."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {CHARACTERS.map((c) => (
          <article key={c.id} className="glass group flex flex-col overflow-hidden rounded-3xl sm:flex-row">
            <div className="relative aspect-square shrink-0 overflow-hidden sm:w-48">
              <img src={CHARACTER_AVATARS[c.id]} alt={c.name} width={512} height={512} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <h2 className={cn("text-xl font-extrabold italic", c.accentClass)}>{c.name}</h2>
                <p className="text-sm text-muted-foreground">{c.title}</p>
              </div>
              <p className="text-sm text-foreground/85">{c.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {c.personality.map((p) => (
                  <span key={p} className="rounded-full border border-glass-border bg-secondary/60 px-2 py-0.5 text-[11px]">{p}</span>
                ))}
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {c.style.map((s) => (
                  <li key={s} className="flex items-center gap-1.5">
                    <span className="size-1 rounded-full bg-neon-cyan" /> {s}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mic2 className="size-3.5" /> Own voice
                </span>
                <Button asChild variant="neon" size="sm" className="rounded-full">
                  <Link to="/arena" search={{ opponent: c.id }}>
                    <Swords /> Debate
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
