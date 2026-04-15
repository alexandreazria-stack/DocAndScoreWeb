import { describe, test, expect } from "vitest";
import {
  calculateScore2Diabetes,
  cholMmolToGl,
  cholGlToMmol,
  hba1cMmolToPct,
  hba1cPctToMmol,
  type Sex,
  type RiskRegion,
} from "@/lib/calculators/score2diabetes";

describe("calculateScore2Diabetes — paper reference cases", () => {
  const base = {
    age: 60,
    smoking: "never" as const,
    sbp: 140,
    totalChol: 5.5,
    hdl: 1.3,
    diabAge: 60,
    hba1c: 50,
    egfr: 90,
  };

  const cases: [Sex, RiskRegion, number][] = [
    ["men",   "low",      8.4],
    ["men",   "moderate", 11.0],
    ["men",   "high",     12.5],
    ["men",   "veryhigh", 20.3],
    ["women", "low",      6.1],
    ["women", "moderate", 7.6],
    ["women", "high",     11.1],
    ["women", "veryhigh", 20.6],
  ];

  test.each(cases)("%s / %s → ~%s%%", (sex, region, expected) => {
    const { tenYearRisk } = calculateScore2Diabetes({ ...base, sex, region });
    expect(Math.abs(tenYearRisk - expected)).toBeLessThanOrEqual(0.1);
  });
});

describe("calculateScore2Diabetes — category thresholds", () => {
  test("classifies low / moderate / high / veryhigh correctly", () => {
    const base = {
      age: 60,
      smoking: "never" as const,
      sbp: 140,
      totalChol: 5.5,
      hdl: 1.3,
      diabAge: 60,
      hba1c: 50,
      egfr: 90,
    };
    expect(calculateScore2Diabetes({ ...base, sex: "men", region: "low" }).category).toBe("moderate");
    expect(calculateScore2Diabetes({ ...base, sex: "women", region: "low" }).category).toBe("moderate");
    expect(calculateScore2Diabetes({ ...base, sex: "men", region: "veryhigh" }).category).toBe("veryhigh");
  });
});

describe("unit converters", () => {
  test("cholesterol mmol/L ↔ g/L round-trips", () => {
    expect(cholGlToMmol(cholMmolToGl(5.5))).toBeCloseTo(5.5, 5);
  });
  test("HbA1c mmol/mol ↔ % round-trips", () => {
    expect(hba1cPctToMmol(hba1cMmolToPct(50))).toBeCloseTo(50, 3);
  });
  test("HbA1c 50 mmol/mol ≈ 6.73%", () => {
    expect(hba1cMmolToPct(50)).toBeCloseTo(6.725, 2);
  });
});
