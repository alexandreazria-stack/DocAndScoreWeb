"use client";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getScoring } from "@/lib/questionnaires";
import { createSession, getPatientUrl, onSessionUpdate, getSessionByCode } from "@/lib/sessions";
import { createSessionRemote, joinAsDoctor } from "@/lib/api";
import type { Session } from "@/lib/sessions";
import type { Questionnaire, Doctor, TestResult } from "@/lib/types";

export function QRScreen({
  test,
  doctor,
  onBack,
  onResult,
  onShowPatient,
}: {
  test: Questionnaire;
  doctor: Doctor;
  onBack: () => void;
  onResult: (result: TestResult) => void;
  onShowPatient: () => void;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"waiting" | "connected" | "progress" | "completed">("waiting");
  const [progress, setProgress] = useState({ answered: 0, total: test.questions.length });
  const [url, setUrl] = useState("");
  const completedHandled = useRef(false);

  // Create session on mount (API + localStorage fallback)
  useEffect(() => {
    const doctorName = `${doctor.title} ${doctor.lastName}`;
    let cancelled = false;

    (async () => {
      try {
        // Try remote API first
        const s = await createSessionRemote(test.id, test.questions.length, doctorName);
        if (cancelled) return;
        setSession(s);
        setUrl(`${window.location.origin}/p/${test.id}/${s.code}`);
      } catch {
        // Fallback to localStorage
        const s = createSession(test.id, test.questions.length, doctorName);
        if (cancelled) return;
        setSession(s);
        setUrl(getPatientUrl(test.id, s.code));
      }
    })();
    return () => { cancelled = true; };
  }, [test, doctor]);

  // Listen for real-time updates via Socket.IO + BroadcastChannel fallback
  useEffect(() => {
    if (!session) return;

    const handleUpdate = (updated: Session) => {
      setStatus(updated.status);
      setProgress({ answered: updated.answeredCount, total: updated.totalQuestions });

      if (updated.status === "completed" && !completedHandled.current) {
        completedHandled.current = true;
        const score = updated.totalScore ?? 0;
        const bracket = getScoring(test, score);
        setTimeout(() => onResult({ test, answers: updated.answers, totalScore: score, scoring: bracket }), 1500);
      }
    };

    // Socket.IO real-time
    let unsubSocket: (() => void) | undefined;
    try {
      unsubSocket = joinAsDoctor(session.code, handleUpdate);
    } catch { /* backend not available */ }

    // BroadcastChannel fallback (same-device)
    const unsubLocal = onSessionUpdate((updated) => {
      if (updated.code === session.code) handleUpdate(updated);
    });

    // Poll localStorage every 3s as last resort
    const interval = setInterval(() => {
      const fresh = getSessionByCode(session.code);
      if (fresh) handleUpdate(fresh);
    }, 3000);

    return () => {
      unsubSocket?.();
      unsubLocal();
      clearInterval(interval);
    };
  }, [session, test, onResult]);

  const handleCopy = () => {
    if (url) navigator.clipboard.writeText(url);
  };

  // Expiry countdown
  const [remaining, setRemaining] = useState("30:00");
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const left = Math.max(0, session.expiresAt - Date.now());
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      setRemaining(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const configs = {
    waiting: { icon: "⏳", label: "En attente du patient...", color: "#8899A8", pulse: true },
    connected: { icon: "📱", label: "Patient connecté", color: "#4A9ABF", pulse: true },
    progress: { icon: "✍️", label: `En cours — ${progress.answered}/${progress.total}`, color: "#4A9ABF", pulse: false },
    completed: { icon: "✅", label: "Terminé !", color: "#2FAF7E", pulse: false },
  };
  const s = configs[status];

  return (
    <div className="pb-20 px-4 bg-ambient grain min-h-dvh">
      <div className="flex items-center gap-3 py-4 animate-fade-in">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-lg text-ds-text-secondary hover:bg-white transition-colors">←</button>
        <span className="font-mono font-bold text-ds-sky text-[15px]">{test.acronym}</span>
        <Badge variant="sky">QR PATIENT</Badge>
      </div>

      {/* QR Card */}
      <div className="ds-card p-7 text-center mb-4 animate-scale-in relative overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-ds-sky/5 blur-3xl pointer-events-none" />

        <p className="text-ds-text-muted text-[13px] mb-6 font-medium relative">Demandez au patient de scanner ce code</p>

        <div className="relative w-[220px] h-[220px] mx-auto mb-5">
          <div className="absolute inset-0 rounded-2xl border-[3px] border-ds-sky/30 shadow-[0_0_20px_rgba(74,154,191,0.12)]" />
          <div className="absolute inset-[3px] rounded-[13px] bg-white flex items-center justify-center p-3">
            {url ? (
              <QRCodeSVG
                value={url}
                size={180}
                level="M"
                bgColor="transparent"
                fgColor="#152233"
              />
            ) : (
              <div className="w-8 h-8 border-3 border-ds-sky/20 border-t-ds-sky rounded-full animate-spin" />
            )}
          </div>
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-[3px] border-l-[3px] border-ds-sky rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-[3px] border-r-[3px] border-ds-sky rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-[3px] border-l-[3px] border-ds-sky rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-[3px] border-r-[3px] border-ds-sky rounded-br-lg" />
        </div>

        <div className="font-mono text-[28px] font-extrabold text-ds-sky tracking-[8px] my-2 relative">
          {session?.code ?? "------"}
        </div>
        <div className="text-[11px] text-ds-text-muted mb-5 font-medium truncate px-4">{url}</div>
        <button
          onClick={handleCopy}
          className="px-5 py-2.5 rounded-[12px] bg-ds-sky/8 text-ds-sky text-[12px] font-bold hover:bg-ds-sky/12 active:scale-[0.98] transition-all"
        >
          📋 Copier le lien
        </button>
      </div>

      {/* Status card */}
      <div className="ds-card p-5 animate-fade-in-up stagger-2">
        <div className={`flex items-center gap-3.5 ${status === "progress" ? "mb-4" : ""}`}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{
              backgroundColor: `${s.color}10`,
              animation: s.pulse ? "pulse-opacity 2s infinite" : "none",
              boxShadow: `0 0 12px ${s.color}15`,
            }}
          >
            {s.icon}
          </div>
          <div>
            <div className="font-bold text-[15px]" style={{ color: s.color }}>{s.label}</div>
            <div className="text-[11px] text-ds-text-muted font-medium">
              {status === "waiting" ? `Le QR code expire dans ${remaining}` : "Session en cours"}
            </div>
          </div>
        </div>
        {status === "progress" && <ProgressBar value={progress.answered} max={progress.total} height={6} />}
      </div>

      <button
        onClick={onShowPatient}
        className="w-full mt-4 py-3.5 rounded-[14px] border border-ds-sky/15 text-ds-sky text-[13px] font-bold hover:bg-ds-sky/5 active:scale-[0.98] transition-all animate-fade-in-up stagger-3"
      >
        👁️ Simuler la vue patient
      </button>
    </div>
  );
}
