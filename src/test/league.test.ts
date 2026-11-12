import { describe, expect, it } from "vitest";
import { computeLeague, leagueProgress, pointsForDebate, recentAverage } from "@/lib/league";

describe("league rules", () => {
  it("new users with no debates stay in Bronze", () => {
    expect(computeLeague("bronze", 0, 0)).toBe("bronze");
  });
  it("promotes to Silver at 3 debates with a recent average of 65", () => {
    expect(computeLeague("bronze", 3, 65)).toBe("silver");
    expect(computeLeague("bronze", 2, 90)).toBe("bronze");
    expect(computeLeague("bronze", 3, 64.9)).toBe("bronze");
  });
  it("promotes to Gold at 8 debates with a recent average of 80", () => {
    expect(computeLeague("silver", 8, 80)).toBe("gold");
    expect(computeLeague("silver", 7, 95)).toBe("silver");
  });
  it("keeps Gold while the recent average stays at 72 or above", () => {
    expect(computeLeague("gold", 9, 72)).toBe("gold");
    expect(computeLeague("gold", 9, 71)).toBe("silver");
  });
  it("demotes Silver to Bronze below a recent average of 55", () => {
    expect(computeLeague("silver", 5, 55)).toBe("silver");
    expect(computeLeague("silver", 5, 54)).toBe("bronze");
  });
  it("awards points with the difficulty multiplier", () => {
    expect(pointsForDebate(80, "easy")).toBe(80);
    expect(pointsForDebate(80, "medium")).toBe(100);
    expect(pointsForDebate(80, "hard")).toBe(120);
    expect(pointsForDebate(150, "easy")).toBe(100);
  });
  it("averages only the last 5 scores", () => {
    expect(recentAverage([100, 100, 100, 100, 100, 0, 0])).toBe(100);
  });
  it("shows Gold as the top league", () => {
    expect(leagueProgress("gold", 10, 85).next).toBeNull();
    expect(leagueProgress("bronze", 0, 0).next).toBe("silver");
  });
});
