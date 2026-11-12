import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Character } from "@/lib/characters";
import { CHARACTER_AVATARS } from "@/lib/character-avatars";

export function CharacterCard({ character, className }: { character: Character; className?: string }) {
  return (
    <Link
      to="/arena"
      search={{ opponent: character.id }}
      className={cn(
        "group glass relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:glow",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={CHARACTER_AVATARS[character.id]}
          alt={character.name}
          width={512}
          height={512}
          loading="lazy"
          className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
      </div>
      <div className="relative -mt-10 flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className={cn("text-lg font-extrabold italic", character.accentClass)}>{character.name}</h3>
          <p className="text-xs font-medium text-muted-foreground">{character.title}</p>
        </div>
        <p className="line-clamp-2 text-sm text-foreground/80">“{character.tagline}”</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {character.personality.slice(0, 3).map((p) => (
            <span key={p} className="rounded-full border border-glass-border bg-secondary/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              {p}
            </span>
          ))}
        </div>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-neon-cyan opacity-80 transition group-hover:gap-2 group-hover:opacity-100">
          Debate {character.name.replace("The ", "")} <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
