import { describe, it, expect } from "vitest";
import { formatDateFR, formatDateLongFR, formatTimeFR } from "@/lib/utils/formatDate";

describe("formatDateFR", () => {
  it("returns a French-formatted date", () => {
    const date = new Date(2026, 0, 15); // 15 Jan 2026
    expect(formatDateFR(date)).toBe("15/01/2026");
  });

  it("defaults to today when no argument", () => {
    const today = new Date().toLocaleDateString("fr-FR");
    expect(formatDateFR()).toBe(today);
  });
});

describe("formatDateLongFR", () => {
  it("includes weekday, day and month in French", () => {
    const date = new Date(2026, 0, 15); // Thursday 15 Jan 2026
    const result = formatDateLongFR(date);
    expect(result).toContain("janvier");
    expect(result).toContain("15");
  });
});

describe("formatTimeFR", () => {
  it("returns HH:MM format", () => {
    const date = new Date(2026, 0, 15, 14, 30, 0);
    expect(formatTimeFR(date)).toBe("14:30");
  });
});
