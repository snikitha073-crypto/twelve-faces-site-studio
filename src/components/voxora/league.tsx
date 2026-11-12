import { Shield, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAGUE_LABEL, leagueProgress, type League } from "@/lib/league";
import { Progress } from "@/components/ui/progress";

const STYLES: Record<League, { text: string; bg: string; border: string; Icon: typeof Shield }> = {
  bronze: { text: "text-bronze", bg: "bg-bronze/10", border: "border-bronze/40", Icon: Medal },
  silver: { text: "text-silver", bg: "bg-silver/10", border: "border-silver/40", Icon: Shield },
  gold: { text: "text-gold", bg: "bg-gold/10", border: "border-gold/50", Icon: Crown },
};

export function LeagueBadge({ league, className, size = "sm" }: { league: string; className?: string; size?: "sm" | "lg" }) {
  const l = (["bronze", "silver", "gold"].includes(league) ? league : "bronze") as League;
  const s = STYLES[l];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        s.text,
        s.bg,
        s.border,
        size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs",
        className,
      )}
    >
      <s.Icon className={size === "lg" ? "size-4" : "size-3.5"} />
      {LEAGUE_LABEL[l]}
    </span>
  );
}

export function LeagueEmblem({ league, className }: { league: League; className?: string }) {
  const s = STYLES[league];
  return (
    <div className={cn("flex size-16 items-center justify-center rounded-2xl border-2", s.bg, s.border, s.text, className)}>
      <s.Icon className="size-8" />
    </div>
  );
}

export function LeagueProgressBlock({
  league,
  debatesCompleted,
  recentAvg,
}: {
  league: League;
  debatesCompleted: number;
  recentAvg: number;
}) {
  const p = leagueProgress(league, debatesCompleted, recentAvg);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{p.next ? `Progress to ${LEAGUE_LABEL[p.next]}` : "Gold league"}</span>
        <span className="font-mono text-foreground">{p.percent}%</span>
      </div>
      <Progress value={p.percent} className="h-2 bg-secondary [&>div]:bg-gradient-neon" />
      <p className="text-xs text-muted-foreground">{p.message}</p>
    </div>
  );
}
