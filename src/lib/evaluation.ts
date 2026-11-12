import { z } from "zod";

export const evaluationSchema = z.object({
  overall_score: z.coerce.number(),
  verdict: z.string().default(""),
  summary: z.string().default(""),
  argument_quality: z.coerce.number().default(0),
  logical_reasoning: z.coerce.number().default(0),
  relevance: z.coerce.number().default(0),
  persuasiveness: z.coerce.number().default(0),
  evidence: z.coerce.number().default(0),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  best_moment: z.string().default(""),
});

export type Evaluation = z.infer<typeof evaluationSchema>;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));

/** Extracts and normalizes the judge's JSON reply. Returns null when no valid object is found. */
export function parseEvaluation(text: string): Evaluation | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(text.slice(start, end + 1));
    const ev = evaluationSchema.parse(raw);
    return {
      ...ev,
      overall_score: Math.round(clamp(ev.overall_score, 0, 100)),
      argument_quality: Math.round(clamp(ev.argument_quality, 0, 10)),
      logical_reasoning: Math.round(clamp(ev.logical_reasoning, 0, 10)),
      relevance: Math.round(clamp(ev.relevance, 0, 10)),
      persuasiveness: Math.round(clamp(ev.persuasiveness, 0, 10)),
      evidence: Math.round(clamp(ev.evidence, 0, 10)),
      strengths: ev.strengths.slice(0, 5),
      weaknesses: ev.weaknesses.slice(0, 5),
      improvements: ev.improvements.slice(0, 5),
    };
  } catch {
    return null;
  }
}
