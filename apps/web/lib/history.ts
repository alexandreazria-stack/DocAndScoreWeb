/**
 * Test history — stored locally on the device only.
 * Medical data must never leave the doctor's device (RGPD/HDS).
 */
import { getSessionRemote } from "@/lib/api";
import { QUESTIONNAIRES, getScoring } from "@/lib/questionnaires";
import type { TestResult, StoredResult } from "@/lib/types";

const HISTORY_KEY = "docandscore_history";
const PENDING_QR_KEY = "docandscore_pending_qr";
const MAX_ENTRIES = 200;

// ===== History =====

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
    patientInitials: result.patientInitials ?? null,
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

// ===== Pending QR sessions (for recovery when doctor closed QR screen early) =====

interface PendingQR {
  code: string;
  testId: string;
  createdAt: number;
}

export function addPendingQR(code: string, testId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PENDING_QR_KEY);
    const existing: PendingQR[] = raw ? JSON.parse(raw) : [];
    existing.push({ code, testId, createdAt: Date.now() });
    localStorage.setItem(PENDING_QR_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

/**
 * Called when the history screen opens.
 * Fetches any pending QR sessions from the API that completed
 * while the doctor was away, and saves them to local history.
 */
export async function recoverCompletedSessions(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PENDING_QR_KEY);
    if (!raw) return;
    const pending: PendingQR[] = JSON.parse(raw);

    // API TTL is 30 min — older entries can't be recovered
    const cutoff = Date.now() - 30 * 60 * 1000;
    const valid = pending.filter((p) => p.createdAt > cutoff);
    if (valid.length === 0) {
      localStorage.removeItem(PENDING_QR_KEY);
      return;
    }

    const history = loadLocalHistory();
    const savedCodes = new Set(history.map((r) => r.sessionCode).filter(Boolean));

    const remaining: PendingQR[] = [];

    await Promise.allSettled(
      valid.map(async (p) => {
        if (savedCodes.has(p.code)) return; // already saved
        try {
          const session = await getSessionRemote(p.code);
          if (!session || session.status !== "completed") {
            remaining.push(p); // still in progress or expired
            return;
          }
          const test = QUESTIONNAIRES.find((q) => q.id === p.testId);
          if (!test) return;
          const score = session.totalScore ?? 0;
          const scoring = getScoring(test, score);
          saveResultLocally({
            test,
            answers: session.answers,
            totalScore: score,
            scoring,
            sessionCode: p.code,
            patientInitials: session.patientInitials,
          });
        } catch {
          remaining.push(p); // keep for next attempt
        }
      })
    );

    if (remaining.length > 0) {
      localStorage.setItem(PENDING_QR_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(PENDING_QR_KEY);
    }
  } catch { /* ignore */ }
}
