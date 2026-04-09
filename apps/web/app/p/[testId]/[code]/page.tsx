"use client";
import { useState, useEffect, use } from "react";
import { Logo } from "@/components/ui/Logo";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QUESTIONNAIRES } from "@/lib/questionnaires";
import { getSessionByCode, updateSession } from "@/lib/sessions";
import { getSessionRemote, updateSessionRemote, joinAsPatient, sendAnswer, sendComplete } from "@/lib/api";
import { calculateScore } from "@/lib/questionnaires";
import type { Questionnaire } from "@/lib/types";

export default function PatientPage({ params }: { params: Promise<{ testId: string; code: string }> }) {
  const { testId, code } = use(params);
  const [test, setTest] = useState<Questionnaire | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [initials, setInitials] = useState("");
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [useRemote, setUseRemote] = useState(false);

  useEffect(() => {
    const found = QUESTIONNAIRES.find((q) => q.id === testId);
    if (!found || found.questions.length === 0) {
      setError("Test introuvable");
      setLoading(false);
      return;
    }
    setTest(found);

    (async () => {
      // Try remote API first
      try {
        const session = await getSessionRemote(code);
        if (session) {
          setUseRemote(true);
          setDoctorName(session.doctorName);
          joinAsPatient(code);
          await updateSessionRemote(code, { status: "connected" });
          setLoading(false);
          return;
        }
      } catch { /* backend unavailable */ }

      // Fallback: localStorage
      const session = getSessionByCode(code);
      if (session) {
        setDoctorName(session.doctorName);
        updateSession(code, { status: "connected" });
      } else {
        setDoctorName("votre médecin");
      }
      setLoading(false);
    })();
  }, [testId, code]);

  const handleStart = async () => {
    const trimmed = initials.trim();
    setStarted(true);
    if (useRemote) {
      await updateSessionRemote(code, { patientInitials: trimmed || undefined });
    } else {
      updateSession(code, { patientInitials: trimmed || undefined });
    }
  };

  const handleAnswer = (questionIdx: number, value: number) => {
    const newAnswers = { ...answers, [questionIdx]: value };
    setAnswers(newAnswers);

    const answeredCount = Object.keys(newAnswers).length;
    if (useRemote) {
      sendAnswer(code, questionIdx, value);
      updateSessionRemote(code, { status: "progress", answeredCount, answers: newAnswers }).catch(() => {});
    } else {
      updateSession(code, { status: "progress", answeredCount, answers: newAnswers });
    }

    if (test && questionIdx === currentQ && currentQ < test.questions.length - 1) {
      setTimeout(() => setCurrentQ((c) => c + 1), 350);
    }
  };

  const handleSubmit = () => {
    if (!test) return;
    const totalScore = calculateScore(test, answers);
    if (useRemote) {
      sendComplete(code, totalScore);
      updateSessionRemote(code, { status: "completed", answeredCount: test.questions.length, answers, totalScore }).catch(() => {});
    } else {
      updateSession(code, { status: "completed", answeredCount: test.questions.length, answers, totalScore });
    }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-ds-sky/20 border-t-ds-sky rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-white px-8 text-center grain">
        <div className="text-5xl mb-4 opacity-30">🔍</div>
        <h2 className="text-xl font-extrabold mb-2">Test introuvable</h2>
        <p className="text-ds-text-muted text-sm">
          Ce lien est invalide ou la session a expiré.<br />
          Demandez un nouveau QR code à votre médecin.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-white px-8 text-center grain">
        <div className="w-20 h-20 rounded-full bg-ds-success/10 flex items-center justify-center text-4xl mb-5 animate-scale-in glow-success">
          ✓
        </div>
        <h2 className="text-[22px] font-extrabold mb-2 tracking-tight animate-fade-in-up stagger-1">
          Envoyé avec succès
        </h2>
        <p className="text-ds-text-muted text-[15px] mb-2 animate-fade-in-up stagger-2 leading-relaxed">
          Vos réponses ont été transmises à {doctorName}.
        </p>
        <p className="text-ds-text-muted text-sm animate-fade-in-up stagger-3">
          Vous pouvez fermer cette page.
        </p>
        <div className="mt-8 animate-fade-in stagger-4">
          <Logo size="sm" />
          <p className="text-[10px] text-ds-text-muted/50 mt-1">Aucune donnée personnelle stockée</p>
        </div>
      </div>
    );
  }

  // Intro screen: ask for initials before starting
  if (!started) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflow: "auto", background: "#fff" }} className="flex flex-col items-center justify-center px-6 grain">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Logo size="md" />
            <p className="text-ds-text-muted text-[14px] mt-3 font-medium">
              Prescrit par {doctorName}
            </p>
          </div>

          <div className="bg-ds-offwhite/60 rounded-2xl p-5 border border-ds-border/40 mb-6">
            <div className="text-[18px] font-extrabold mb-1">{test.name}</div>
            <div className="text-[13px] text-ds-text-muted">{test.questions.length} questions · {test.duration}</div>
          </div>

          <label className="text-[12px] font-bold text-ds-text-secondary/80 uppercase tracking-wider block mb-2">
            Vos initiales
          </label>
          <input
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 4))}
            onKeyDown={(e) => { if (e.key === "Enter" && initials.trim().length > 0) handleStart(); }}
            placeholder="ex: J.M."
            className="w-full bg-ds-offwhite/80 rounded-[14px] border border-ds-border/50 px-4 py-3.5 text-[18px] font-bold text-ds-text text-center tracking-widest outline-none focus:border-ds-sky/40 focus:bg-white transition-all mb-6"
            autoFocus
          />

          <button
            onClick={handleStart}
            disabled={initials.trim().length === 0}
            className="w-full py-4 rounded-[16px] text-[16px] font-bold bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white shadow-md disabled:opacity-30 disabled:pointer-events-none hover:-translate-y-0.5 active:scale-[0.98] transition-all"
          >
            Commencer →
          </button>
        </div>
      </div>
    );
  }

  const total = test.questions.length;
  const q = test.questions[currentQ];
  const options = q?.options ?? [];

  return (
    <div className="min-h-dvh bg-white flex flex-col grain">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-ds-border-light/50 glass-strong">
        <div className="flex justify-between items-center mb-2.5">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ds-success animate-pulse" />
            <span className="text-[11px] text-ds-text-muted font-medium">
              {doctorName}
            </span>
          </div>
        </div>
        <ProgressBar value={currentQ + (answers[currentQ] !== undefined ? 1 : 0)} max={total} height={5} />
        <div className="flex justify-between items-center mt-2">
          <div className="text-[12px] text-ds-text-muted font-bold tracking-wide">
            Question {currentQ + 1} / {total}
          </div>
          <div className="font-mono text-[11px] text-ds-sky font-bold">{test.acronym}</div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-5 pt-8" key={currentQ}>
        <h2 className="text-[20px] font-extrabold leading-relaxed mb-2 tracking-tight animate-fade-in-up">
          {q?.text}
        </h2>
        {q?.note && (
          <p className="text-[12px] text-ds-text-muted italic mb-6 animate-fade-in">{q.note}</p>
        )}

        {q?.type === "slider" ? (
          <div className="text-center mt-4 animate-scale-in">
            <div
              className="text-[56px] font-extrabold mb-4 transition-colors duration-300"
              style={{
                color: (answers[currentQ] ?? 5) <= 3 ? "#2FAF7E" : (answers[currentQ] ?? 5) <= 6 ? "#D99A3E" : "#D14F4F",
              }}
            >
              {answers[currentQ] ?? 5}
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={answers[currentQ] ?? 5}
              onChange={(e) => handleAnswer(currentQ, Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-ds-text-muted mt-3 font-medium">
              <span>Aucune douleur</span>
              <span>Douleur maximale</span>
            </div>
          </div>
        ) : q?.type === "score" ? (
          <div className="flex gap-2 flex-wrap mt-4 animate-fade-in-up stagger-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(currentQ, opt.value)}
                className={`w-12 h-12 rounded-[12px] text-[15px] font-bold transition-all duration-200 ${
                  answers[currentQ] === opt.value
                    ? "bg-gradient-to-br from-ds-sky to-[#3D8DB5] text-white shadow-md scale-110"
                    : "bg-ds-offwhite/60 text-ds-text-secondary hover:bg-ds-offwhite border border-transparent"
                }`}
              >
                {opt.value}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-2">
            {options.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(currentQ, opt.value)}
                className={`flex items-center gap-4 px-5 py-4 rounded-[16px] text-[15px] text-left min-h-[58px] transition-all duration-200 animate-fade-in-up ${
                  answers[currentQ] === opt.value
                    ? "bg-gradient-to-r from-ds-sky/10 to-ds-sky/5 text-ds-sky font-bold border border-ds-sky/20 shadow-sm"
                    : "bg-ds-offwhite/60 text-ds-text hover:bg-ds-offwhite border border-transparent"
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span
                  className={`w-9 h-9 rounded-full text-sm flex items-center justify-center font-bold shrink-0 transition-all duration-200 ${
                    answers[currentQ] === opt.value
                      ? "bg-gradient-to-br from-ds-sky to-[#3D8DB5] text-white shadow-sm"
                      : "bg-ds-border/50 text-ds-text-muted"
                  }`}
                >
                  {opt.value}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-5 pt-3 pb-5 flex gap-2.5">
        {currentQ > 0 && (
          <button
            onClick={() => setCurrentQ((c) => c - 1)}
            className="px-5 py-3.5 rounded-[14px] text-ds-text-secondary text-sm font-semibold hover:bg-ds-offwhite transition-all"
          >
            ←
          </button>
        )}
        <div className="flex-1" />
        {currentQ === total - 1 && Object.keys(answers).length === total ? (
          <button
            onClick={handleSubmit}
            className="py-3.5 px-6 rounded-[14px] text-[14px] font-bold bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
          >
            Envoyer →
          </button>
        ) : (
          currentQ < total - 1 &&
          answers[currentQ] !== undefined && (
            <button
              onClick={() => setCurrentQ((c) => c + 1)}
              className="py-3.5 px-6 rounded-[14px] text-[14px] font-bold bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              Suivant →
            </button>
          )
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-ds-border-light/30 flex items-center justify-center gap-2 bg-ds-offwhite/30">
        <Logo size="sm" />
        <span className="text-[10px] text-ds-text-muted/50">· Aucune donnée stockée</span>
      </div>
    </div>
  );
}
