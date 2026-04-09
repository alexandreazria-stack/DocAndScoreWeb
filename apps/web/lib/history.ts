/**
 * Test history — stored locally on the device only.
 * Medical data must never leave the doctor's device (RGPD + HDS).
 */
import type { TestResult, StoredResult } from "@/lib/types";

const HISTORY_KEY = "docandscore_history";
const MAX_ENTRIES = 200;

export function saveResultLocally(result: TestResult): void {
  if (typeof window === "undefined") return;
  const entry: StoredResult = {
    id: crypto.randomUUID(),
    testId: result.test.id,
    testAcronym: result.test.acronym,
    testName: result.test.name,
    testIcon: result.test.icon,
    totalScore: result.totalScore,
    maxScore: result.test.maxScore,
    scoringLabel: result.scoring.label,
    scoringColor: result.scoring.color,
    scoringSeverity: result.scoring.severity,
    sessionCode: result.sessionCode ?? null,
    createdAt: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const existing: StoredResult[] = raw ? JSON.parse(raw) : [];
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function loadLocalHistory(): StoredResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
