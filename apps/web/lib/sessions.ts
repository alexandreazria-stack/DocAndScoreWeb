/**
 * Session management for QR patient flow.
 * Uses localStorage + BroadcastChannel for same-device demo.
 * Ready to swap for Supabase Realtime in production.
 */

export interface Session {
  id: string;
  code: string;
  testId: string;
  doctorName: string;
  status: "waiting" | "connected" | "progress" | "completed";
  answeredCount: number;
  totalQuestions: number;
  answers: Record<number, number>;
  totalScore: number | null;
  createdAt: number;
  expiresAt: number;
}

const STORAGE_KEY = "ds_sessions";
const CHANNEL_NAME = "ds_session_updates";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getAllSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions: Session[] = JSON.parse(raw);
    // Purge expired sessions (30 min)
    const now = Date.now();
    return sessions.filter((s) => s.expiresAt > now);
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function createSession(testId: string, totalQuestions: number, doctorName: string): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    code: generateCode(),
    testId,
    doctorName,
    status: "waiting",
    answeredCount: 0,
    totalQuestions,
    answers: {},
    totalScore: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 min
  };
  const sessions = getAllSessions();
  sessions.push(session);
  saveSessions(sessions);
  broadcastUpdate(session);
  return session;
}

export function getSessionByCode(code: string): Session | null {
  return getAllSessions().find((s) => s.code === code) ?? null;
}

export function updateSession(code: string, updates: Partial<Session>): Session | null {
  const sessions = getAllSessions();
  const idx = sessions.findIndex((s) => s.code === code);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], ...updates };
  saveSessions(sessions);
  broadcastUpdate(sessions[idx]);
  return sessions[idx];
}

export function getActiveSessions(): Session[] {
  return getAllSessions().filter((s) => s.status !== "completed");
}

export function getCompletedSessions(): Session[] {
  return getAllSessions().filter((s) => s.status === "completed");
}

// ===== BroadcastChannel for cross-tab real-time =====
// In production, replace with Supabase Realtime subscriptions

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return channel;
}

function broadcastUpdate(session: Session) {
  getChannel()?.postMessage({ type: "session_update", session });
}

export function onSessionUpdate(callback: (session: Session) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (e: MessageEvent) => {
    if (e.data?.type === "session_update") {
      callback(e.data.session);
    }
  };
  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}

export function getPatientUrl(testId: string, code: string): string {
  if (typeof window === "undefined") return "";
  const base = window.location.origin;
  return `${base}/p/${testId}/${code}`;
}
