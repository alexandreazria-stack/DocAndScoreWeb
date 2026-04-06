/**
 * API client for the DocAndScore backend.
 * In dev, hits localhost:3001. In prod, hits NEXT_PUBLIC_API_URL.
 */
import { io, Socket } from "socket.io-client";
import type { Session } from "./sessions";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const WS_PATH = "/ws";

// ===== REST =====

export async function createSessionRemote(
  testId: string,
  totalQuestions: number,
  doctorName: string
): Promise<Session> {
  const res = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testId, totalQuestions, doctorName }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function getSessionRemote(code: string): Promise<Session | null> {
  const res = await fetch(`${API_URL}/api/sessions/${code}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to get session");
  return res.json();
}

export async function updateSessionRemote(
  code: string,
  updates: Partial<Session>
): Promise<Session> {
  const res = await fetch(`${API_URL}/api/sessions/${code}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update session");
  return res.json();
}

// ===== Socket.IO =====

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, { path: WS_PATH, transports: ["websocket", "polling"] });
  }
  return socket;
}

export function joinAsDoctor(code: string, onUpdate: (session: Session) => void): () => void {
  const s = getSocket();
  s.emit("doctor:join", code);
  s.on("session:update", onUpdate);
  s.on("session:completed", onUpdate);
  return () => {
    s.off("session:update", onUpdate);
    s.off("session:completed", onUpdate);
  };
}

export function joinAsPatient(code: string): Socket {
  const s = getSocket();
  s.emit("patient:join", code);
  return s;
}

export function sendAnswer(code: string, questionIndex: number, value: number) {
  getSocket().emit("patient:answer", { code, questionIndex, value });
}

export function sendComplete(code: string, totalScore: number) {
  getSocket().emit("patient:complete", { code, totalScore });
}
