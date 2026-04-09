import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createSession,
  getAllSessions,
  getSessionByCode,
  updateSession,
  getActiveSessions,
  getCompletedSessions,
} from "@/lib/sessions";

// ── localStorage mock ──────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
};
vi.stubGlobal("localStorage", localStorageMock);

// ──────────────────────────────────────────────────────────────────────────────

beforeEach(() => localStorageMock.clear());

describe("createSession", () => {
  it("returns a session with correct shape", () => {
    const s = createSession("phq9", 9, "Dr. Martin");
    expect(s.testId).toBe("phq9");
    expect(s.totalQuestions).toBe(9);
    expect(s.doctorName).toBe("Dr. Martin");
    expect(s.status).toBe("waiting");
    expect(s.code).toHaveLength(6);
    expect(s.answeredCount).toBe(0);
    expect(s.answers).toEqual({});
    expect(s.totalScore).toBeNull();
  });

  it("persists to localStorage", () => {
    createSession("phq9", 9, "Dr. Martin");
    const saved = getAllSessions();
    expect(saved).toHaveLength(1);
  });

  it("generates unique codes for multiple sessions", () => {
    const a = createSession("phq9", 9, "Dr. A");
    const b = createSession("gad7", 7, "Dr. B");
    expect(a.code).not.toBe(b.code);
  });

  it("sets expiresAt 30 minutes from now", () => {
    const before = Date.now();
    const s = createSession("phq9", 9, "Dr. Martin");
    const after = Date.now();
    expect(s.expiresAt).toBeGreaterThanOrEqual(before + 30 * 60 * 1000);
    expect(s.expiresAt).toBeLessThanOrEqual(after + 30 * 60 * 1000);
  });
});

describe("getAllSessions", () => {
  it("returns empty array when nothing stored", () => {
    expect(getAllSessions()).toEqual([]);
  });

  it("filters out expired sessions", () => {
    createSession("phq9", 9, "Dr. Martin");
    // Manually expire the session
    const raw = localStorageMock.getItem("ds_sessions")!;
    const sessions = JSON.parse(raw);
    sessions[0].expiresAt = Date.now() - 1;
    localStorageMock.setItem("ds_sessions", JSON.stringify(sessions));

    expect(getAllSessions()).toHaveLength(0);
  });

  it("returns valid sessions", () => {
    createSession("phq9", 9, "Dr. A");
    createSession("gad7", 7, "Dr. B");
    expect(getAllSessions()).toHaveLength(2);
  });

  it("returns empty array on corrupted localStorage", () => {
    localStorageMock.setItem("ds_sessions", "not-json{{{");
    expect(getAllSessions()).toEqual([]);
  });
});

describe("getSessionByCode", () => {
  it("returns the matching session", () => {
    const s = createSession("phq9", 9, "Dr. Martin");
    const found = getSessionByCode(s.code);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(s.id);
  });

  it("returns null for unknown code", () => {
    expect(getSessionByCode("XXXXXX")).toBeNull();
  });
});

describe("updateSession", () => {
  it("updates status and answeredCount", () => {
    const s = createSession("phq9", 9, "Dr. Martin");
    const updated = updateSession(s.code, { status: "progress", answeredCount: 3 });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("progress");
    expect(updated!.answeredCount).toBe(3);
  });

  it("returns null for unknown code", () => {
    expect(updateSession("XXXXXX", { status: "completed" })).toBeNull();
  });

  it("persists the update", () => {
    const s = createSession("phq9", 9, "Dr. Martin");
    updateSession(s.code, { totalScore: 18, status: "completed" });
    const found = getSessionByCode(s.code);
    expect(found!.totalScore).toBe(18);
    expect(found!.status).toBe("completed");
  });
});

describe("getActiveSessions / getCompletedSessions", () => {
  it("correctly partitions by status", () => {
    const a = createSession("phq9", 9, "Dr. A");
    const b = createSession("gad7", 7, "Dr. B");
    updateSession(b.code, { status: "completed" });

    expect(getActiveSessions().map(s => s.id)).toContain(a.id);
    expect(getCompletedSessions().map(s => s.id)).toContain(b.id);
    expect(getActiveSessions().map(s => s.id)).not.toContain(b.id);
  });
});
