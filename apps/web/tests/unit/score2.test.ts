import { describe, it, expect } from "vitest";
import { SCORE2_CALCULATOR } from "@/lib/calculators/score2";

const calc = SCORE2_CALCULATOR;

describe("SCORE2 calculator — metadata", () => {
  it("has required fields", () => {
    expect(calc.id).toBe("score2");
    expect(calc.acronym).toBe("SCORE2");
    expect(calc.testType).toBe("calculator");
    expect(calc.params.length).toBeGreaterThan(0);
  });
});

describe("SCORE2 calculator — calculate()", () => {
  const base = { age: 55, sex: "male", smoking: 0, sbp: 130, nonHdl: 4.5 };

  it("returns a result for a valid male profile", () => {
    const result = calc.calculate(base);
    expect(result).not.toBeNull();
    expect(result!.riskPercent).toBeGreaterThan(0);
    expect(result!.riskPercent).toBeLessThan(100);
    expect(result!.riskLabel).toBeTruthy();
  });

  it("returns a result for a valid female profile", () => {
    const result = calc.calculate({ ...base, sex: "female" });
    expect(result).not.toBeNull();
    expect(result!.riskPercent).toBeGreaterThan(0);
  });

  it("smoker has higher risk than non-smoker (same profile)", () => {
    const nonSmoker = calc.calculate({ ...base, smoking: 0 });
    const smoker = calc.calculate({ ...base, smoking: 1 });
    expect(smoker!.riskPercent).toBeGreaterThan(nonSmoker!.riskPercent);
  });

  it("higher SBP increases risk", () => {
    const normal = calc.calculate({ ...base, sbp: 120 });
    const high = calc.calculate({ ...base, sbp: 160 });
    expect(high!.riskPercent).toBeGreaterThan(normal!.riskPercent);
  });

  it("correctly labels low risk for young healthy patient", () => {
    const result = calc.calculate({ age: 40, sex: "female", smoking: 0, sbp: 115, nonHdl: 3.0 });
    expect(result!.interpretation).toMatch(/faible/i);
  });

  it("correctly labels high risk for old smoker with high SBP", () => {
    const result = calc.calculate({ age: 75, sex: "male", smoking: 1, sbp: 180, nonHdl: 7.0 });
    expect(result!.interpretation).toMatch(/élevé/i);
  });

  it("riskLabel is a formatted percentage string", () => {
    const result = calc.calculate(base);
    expect(result!.riskLabel).toMatch(/^\d+(\.\d+)?%$/);
  });

  it("returns null for out-of-range age (< 40)", () => {
    const result = calc.calculate({ ...base, age: 20 });
    expect(result).toBeNull();
  });

  it("includes recommendations", () => {
    const result = calc.calculate(base);
    expect(Array.isArray(result!.recommendations)).toBe(true);
    expect(result!.recommendations.length).toBeGreaterThan(0);
  });

  it("risk is within [0.1, 99.9]", () => {
    const profiles = [
      { age: 40, sex: "male", smoking: 0, sbp: 100, nonHdl: 2.0 },
      { age: 89, sex: "male", smoking: 1, sbp: 200, nonHdl: 10.0 },
      { age: 55, sex: "female", smoking: 1, sbp: 150, nonHdl: 6.0 },
    ];
    for (const p of profiles) {
      const result = calc.calculate(p);
      if (result) {
        expect(result.riskPercent).toBeGreaterThanOrEqual(0.1);
        expect(result.riskPercent).toBeLessThanOrEqual(99.9);
      }
    }
  });
});
