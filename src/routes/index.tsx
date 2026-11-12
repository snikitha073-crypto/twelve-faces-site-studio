import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Quote, Swords, Trophy, Zap } from "lucide-react";

import heroImg from "@/assets/arena-hero.jpg";
import { Button } from "@/components/ui/button";
import { CHARACTERS } from "@/lib/characters";
import { CharacterCard } from "@/components/voxora/character-card";
import { SectionTitle, StatCard } from "@/components/voxora/ui";
import { LeagueBadge, LeagueProgressBlock } from "@/components/voxora/league";
import { useVoxora } from "@/hooks/use-voxora";
import type { League } from "@/lib/league";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voxora – AI Debate Arena" },
      { name: "description", content: "Pick an AI opponent, argue your side and get a judge's report. Think. Challenge. Debate. Improve." },
      { property: "og:title", content: "Voxora – AI Debate Arena" },
      { property: "og:description", content: "Pick an AI opponent, argue your side and get a judge's report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { profile } = useVoxora();
  return (
    <div className="space-y-10">
      <section className="glass-strong neon-border relative overflow-hidden rounded-3xl">
        <img src={heroImg} alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        <div className="relative flex flex-col gap-6 px-6 py-12 sm:px-10 sm:py-16 lg:max-w-2xl">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-glass-border bg-secondary/60 px-3 py-1 text-xs font-semibold text-neon-cyan">
            <Zap className="size-3.5" /> AI Debate Arena
          </span>
          <h1 className="text-4xl font-extrabold italic leading-[1.05] sm:text-6xl">
            {profile ? (
              <>
                Welcome back, <span className="text-gradient-brand">{profile.display_name}</span>
              </>
            ) : (
              <>
                Welcome to <span className="text-gradient-brand">VOXORA</span>
              </>
            )}
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            Think. Challenge. Debate. Improve. Take a side, face an AI opponent that always argues back, and get scored by an impartial judge.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl" className="rounded-full px-8">
              <Link to="/arena">
                <Swords /> Start a Debate
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl" className="rounded-full px-7">
              <Link to="/topics">
                <Compass /> Explore Topics
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {profile ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="League" value={<LeagueBadge league={profile.league} size="lg" />} icon={<Trophy />} />
          <StatCard label="Points" value={<span className="font-mono">{profile.points}</span>} />
          <StatCard label="Debates" value={<span className="font-mono">{profile.debates_completed}</span>} />
          <div className="glass rounded-2xl p-4 sm:p-5">
            <LeagueProgressBlock
              league={profile.league as League}
              debatesCompleted={profile.debates_completed}
              recentAvg={Number(profile.recent_avg_score)}
            />
          </div>
        </section>
      ) : (
        <section className="glass flex items-start gap-4 rounded-2xl p-5 sm:items-center sm:p-6">
          <Quote className="size-8 shrink-0 text-neon-violet" />
          <div>
            <p className="text-lg font-semibold italic">“It is the mark of an educated mind to be able to entertain a thought without accepting it.”</p>
            <p className="mt-1 text-sm text-muted-foreground">— Aristotle</p>
          </div>
        </section>
      )}

      <section>
        <SectionTitle
          title="Choose Your Opponent"
          subtitle="Six minds, six styles. Each one takes the opposite side to yours."
          action={
            <Link to="/opponents" className="text-sm font-semibold text-neon-cyan hover:underline">
              View all
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHARACTERS.map((c) => (
            <CharacterCard key={c.id} character={c} className="animate-rise" />
          ))}
        </div>
      </section>
    </div>
  );
}
