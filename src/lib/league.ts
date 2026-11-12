// League and scoring rules. Pure functions: used by the server to award points/leagues,
// and by the UI only to display progress. Clients never write these values.
import type { Difficulty } from "./topics";

export type League = "bronze" | "silver" | "gold";

export const LEAGUES: League[] = ["bronze", "silver", "gold"];
export const LEAGUE_LABEL: Record<League, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold" };

export const RULES = {
  recentWindow: 5,
  silver: { minDebates: 3, promoteAvg: 65, keepAvg: 55 },
  gold: { minDebates: 8, promoteAvg: 80, keepAvg: 72 },
} as const;

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = { easy: 1, medium: 1.25, hard: 1.5 };

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function pointsForDebate(score: number, difficulty: Difficulty): number {
  return Math.round(clampScore(score) * DIFFICULTY_MULTIPLIER[difficulty]);
}

/** Average of the most recent completed scores (newest first). */
export function recentAverage(scoresNewestFirst: number[], window: number = RULES.recentWindow): number {
  const recent = scoresNewestFirst.slice(0, window);
  if (recent.length === 0) return 0;
  return Math.round((recent.reduce((a, b) => a + b, 0) / recent.length) * 100) / 100;
}

export function computeLeague(current: League, debatesCompleted: number, recentAvg: number): League {
  const promoteGold = debatesCompleted >= RULES.gold.minDebates && recentAvg >= RULES.gold.promoteAvg;
  const keepGold = current === "gold" && recentAvg >= RULES.gold.keepAvg;
  if (promoteGold || keepGold) return "gold";
  const promoteSilver = debatesCompleted >= RULES.silver.minDebates && recentAvg >= RULES.silver.promoteAvg;
  const keepSilver = (current === "silver" || current === "gold") && recentAvg >= RULES.silver.keepAvg;
  if (promoteSilver || keepSilver) return "silver";
  return "bronze";
}

export interface LeagueProgress {
  next: League | null;
  percent: number;
  debatesNeeded: number;
  avgNeeded: number;
  message: string;
}

export function leagueProgress(league: League, debatesCompleted: number, recentAvg: number): LeagueProgress {
  if (league === "gold") {
    return {
      next: null,
      percent: 100,
      debatesNeeded: 0,
      avgNeeded: RULES.gold.keepAvg,
      message: `Top league reached. Keep your recent average above ${RULES.gold.keepAvg} to stay in Gold.`,
    };
  }
  const target = league === "bronze" ? RULES.silver : RULES.gold;
  const next: League = league === "bronze" ? "silver" : "gold";
  const debatePart = Math.min(debatesCompleted / target.minDebates, 1);
  const avgPart = Math.min(recentAvg / target.promoteAvg, 1);
  const percent = Math.round(((debatePart + avgPart) / 2) * 100);
  const debatesNeeded = Math.max(target.minDebates - debatesCompleted, 0);
  const parts: string[] = [];
  if (debatesNeeded > 0) parts.push(`${debatesNeeded} more debate${debatesNeeded === 1 ? "" : "s"}`);
  if (recentAvg < target.promoteAvg) parts.push(`a recent average of ${target.promoteAvg}+`);
  return {
    next,
    percent,
    debatesNeeded,
    avgNeeded: target.promoteAvg,
    message: parts.length
      ? `Reach ${LEAGUE_LABEL[next]} with ${parts.join(" and ")}.`
      : `Promotion to ${LEAGUE_LABEL[next]} on your next completed debate.`,
  };
}
