"use client";
import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QUESTIONNAIRES } from "@/lib/questionnaires";
import { getAllSessions, onSessionUpdate } from "@/lib/sessions";
import { CALCULATORS } from "@/lib/calculators";
import type { Session } from "@/lib/sessions";
import type { Questionnaire, Doctor, AppTab } from "@/lib/types";
import type { Calculator } from "@/lib/calculators/types";

function ActiveSessionsBubble() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Load and refresh active sessions
  useEffect(() => {
    const refresh = () => {
      const all = [...getAllSessions()].sort((a, b) => b.createdAt - a.createdAt);
      setSessions(all);
    };
    refresh();
    // Listen for BroadcastChannel updates
    const unsub = onSessionUpdate(() => refresh());
    // Also poll every 3s
    const interval = setInterval(refresh, 3000);
    return () => { unsub(); clearInterval(interval); };
  }, []);

  if (sessions.length === 0) return null;

  const statusConfig = {
    waiting: { color: "#8899A8", icon: "⏳", label: "En attente" },
    connected: { color: "#4A9ABF", icon: "📱", label: "Connecté" },
    progress: { color: "#4A9ABF", icon: "✍️", label: "En cours" },
    completed: { color: "#2FAF7E", icon: "✅", label: "Terminé" },
  };

  return (
    <div className="mb-5 animate-fade-in-up">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full ds-card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
      >
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-ds-sky/15 to-ds-sky/5 flex items-center justify-center text-lg">
            📱
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ds-sky text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {sessions.length}
          </div>
        </div>
        <div className="flex-1 text-left">
          <div className="text-[14px] font-bold text-ds-text">
            {sessions.length} session{sessions.length > 1 ? "s" : ""} patient{sessions.length > 1 ? "s" : ""
            } · 30 dernières min
          </div>
          <div className="text-[11px] text-ds-text-muted font-medium">
            {sessions.filter(s => s.status === "completed").length} terminé{sessions.filter(s => s.status === "completed").length > 1 ? "s" : ""} ·{" "}
            {sessions.filter(s => s.status === "progress" || s.status === "waiting" || s.status === "connected").length} en cours
          </div>
        </div>
        <span className={`text-ds-text-muted text-sm transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2 animate-fade-in-up">
          {sessions.map((session) => {
            const cfg = statusConfig[session.status];
            const test = QUESTIONNAIRES.find(q => q.id === session.testId);
            return (
              <div key={session.id} className="ds-card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{test?.icon ?? "📋"}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[13px] text-ds-sky">{test?.acronym ?? session.testId}</span>
                      <span className="font-mono text-[11px] text-ds-text-muted tracking-wider">{session.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: cfg.color,
                        animation: session.status === "waiting" || session.status === "connected" ? "pulse-opacity 2s infinite" : "none",
                      }}
                    />
                    <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                {(session.status === "progress" || session.status === "completed") && (
                  <ProgressBar value={session.answeredCount} max={session.totalQuestions} height={4} />
                )}
                {session.status === "completed" && session.totalScore !== null && (
                  <div className="mt-2 text-[12px] font-bold text-ds-success">
                    Score: {session.totalScore}/{test?.maxScore ?? "?"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardScreen({
  doctor,
  onNavigate,
  onSelectTest,
  onSelectQR,
  onSelectCalculator,
}: {
  doctor: Doctor;
  onNavigate: (tab: AppTab) => void;
  onSelectTest: (test: Questionnaire) => void;
  onSelectQR: (test: Questionnaire) => void;
  onSelectCalculator: (calc: Calculator) => void;
}) {
  const freeTests = QUESTIONNAIRES.filter((q) => q.questions.length > 0);
  const proTests: Questionnaire[] = [];

  return (
    <div className="pb-24 px-4 pt-5 bg-ambient grain max-w-3xl mx-auto sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 animate-fade-in-up">
        <Logo size="md" />
        <div className="px-3 py-1.5 rounded-full bg-ds-sky/10 text-ds-sky text-[11px] font-bold tracking-wide">
          BETA
        </div>
      </div>

      <div className="animate-fade-in-up stagger-1">
        <h1 className="text-[24px] sm:text-[30px] font-extrabold mt-5 mb-1 tracking-tight leading-tight">
          Bonjour {doctor.title} {doctor.lastName}{" "}
          <span className="inline-block animate-float">👋</span>
        </h1>
        <p className="text-ds-text-muted text-[14px] mb-5 font-medium">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Active patient sessions */}
      <ActiveSessionsBubble />

      {/* Calculators */}
      {CALCULATORS.map((calc) => (
        <div
          key={calc.id}
          onClick={() => onSelectCalculator(calc)}
          className="animate-fade-in-up stagger-2 ds-card ds-card-hover flex items-center gap-3.5 p-4 mb-3 cursor-pointer"
        >
          <div className="w-11 h-11 rounded-[12px] bg-red-50 flex items-center justify-center text-xl shrink-0">
            {calc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[13px] text-red-500">{calc.acronym}</span>
              <span className="text-[9px] font-bold bg-red-50 text-red-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Calculateur</span>
            </div>
            <p className="text-[12px] text-ds-text-muted truncate">{calc.pathology}</p>
          </div>
          <span className="text-ds-text-muted text-sm">→</span>
        </div>
      ))}

      {/* Tests count banner */}
      <div className="animate-fade-in-up stagger-2 relative overflow-hidden rounded-2xl p-4 mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(74,154,191,0.08) 0%, rgba(74,154,191,0.04) 100%)",
          border: "1px solid rgba(74,154,191,0.12)",
        }}
      >
        <span className="text-[13px] text-ds-sky font-semibold">
          📋 {freeTests.length} tests cliniques disponibles
        </span>
      </div>

      {/* Search card */}
      <div
        onClick={() => onNavigate("search")}
        className="animate-fade-in-up stagger-2 ds-card ds-card-hover flex items-center gap-3.5 p-4 mb-7 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-[12px] bg-ds-sky/8 flex items-center justify-center">
          <span className="text-lg">🔍</span>
        </div>
        <span className="text-ds-text-muted text-[15px] font-medium">Rechercher un test...</span>
      </div>

      {/* Free tests */}
      <div className="animate-fade-in-up stagger-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-ds-sky to-ds-sky-light" />
          <h2 className="text-[15px] font-bold text-ds-text-secondary uppercase tracking-wider">
            Tests disponibles
          </h2>
          <span className="text-ds-text-muted text-xs font-mono">({freeTests.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {freeTests.map((test, i) => (
          <div
            key={test.id}
            className={`ds-card ds-card-hover p-4 animate-fade-in-up stagger-${Math.min(i + 3, 8)}`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-ds-sky-pale to-ds-sky-ghost flex items-center justify-center text-[24px] shrink-0 shadow-sm">
                {test.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono font-bold text-ds-sky text-[14px] tracking-tight">
                    {test.acronym}
                  </span>
                  <span className="text-[12px] text-ds-text-secondary font-medium truncate">
                    {test.name}
                  </span>
                </div>
                <p className="text-[12px] text-ds-text-muted mt-0.5 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-ds-sky/30" />
                  {test.pathology}
                  <span className="text-ds-border">·</span>
                  {test.duration}
                  <span className="text-ds-border">·</span>
                  {test.questions.length}q
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onSelectTest(test)}
                    className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white text-[12px] font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                  >
                    📋 Médecin
                  </button>
                  <button
                    onClick={() => onSelectQR(test)}
                    className="flex-1 py-2.5 rounded-[12px] bg-ds-sky/8 text-ds-sky text-[12px] font-bold hover:bg-ds-sky/12 active:scale-[0.98] transition-all duration-200"
                  >
                    📱 QR Patient
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
