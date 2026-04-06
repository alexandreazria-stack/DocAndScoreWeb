"use client";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Questionnaire, Doctor } from "@/lib/types";

export function PatientScreen({
  test,
  doctor,
  onComplete,
}: {
  test: Questionnaire;
  doctor: Doctor;
  onComplete: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const total = test.questions.length;
  const options = test.questions[currentQ]?.options ?? [];

  if (submitted) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-white px-8 text-center grain">
        <div className="w-20 h-20 rounded-full bg-ds-success/10 flex items-center justify-center text-4xl mb-5 animate-scale-in glow-success">
          ✓
        </div>
        <h2 className="text-[22px] font-extrabold mb-2 tracking-tight animate-fade-in-up stagger-1">Envoyé avec succès</h2>
        <p className="text-ds-text-muted text-[15px] mb-8 animate-fade-in-up stagger-2 leading-relaxed">
          Vos réponses ont été transmises au {doctor.title} {doctor.lastName}.<br />
          Vous pouvez fermer cette page.
        </p>
        <button onClick={onComplete} className="text-ds-text-muted text-[13px] font-semibold hover:text-ds-text transition-colors animate-fade-in stagger-3">
          ← Retour à la démo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col grain">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-ds-border-light/50 glass-strong">
        <div className="flex justify-between items-center mb-2.5">
          <Logo size="sm" />
          <span className="text-[11px] text-ds-text-muted font-medium">Prescrit par {doctor.title} {doctor.lastName}</span>
        </div>
        <ProgressBar value={currentQ + (answers[currentQ] !== undefined ? 1 : 0)} max={total} height={5} />
        <div className="text-[12px] text-ds-text-muted mt-2 font-bold tracking-wide">
          Question {currentQ + 1} / {total}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-5 pt-8 animate-fade-in-up" key={currentQ}>
        <h2 className="text-[20px] font-extrabold leading-relaxed mb-8 tracking-tight">{test.questions[currentQ]?.text}</h2>
        <div className="flex flex-col gap-3">
          {options.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => {
                setAnswers((a) => ({ ...a, [currentQ]: opt.value }));
                setTimeout(() => {
                  if (currentQ < total - 1) setCurrentQ((c) => c + 1);
                }, 300);
              }}
              className={`flex items-center gap-4 px-5 py-4.5 rounded-[16px] text-[15px] text-left min-h-[58px] transition-all duration-200 animate-fade-in-up ${
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
      </div>

      {/* Navigation */}
      <div className="px-5 pt-3 pb-5 flex gap-2.5">
        {currentQ > 0 && (
          <button
            onClick={() => setCurrentQ((c) => c - 1)}
            className="px-5 py-3.5 rounded-[14px] text-ds-text-secondary text-sm font-semibold hover:bg-ds-offwhite transition-all"
          >
            ← Précédent
          </button>
        )}
        <div className="flex-1" />
        {currentQ === total - 1 && Object.keys(answers).length === total ? (
          <button
            onClick={() => setSubmitted(true)}
            className="py-3.5 px-6 rounded-[14px] text-[14px] font-bold bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
          >
            Envoyer au {doctor.title} {doctor.lastName} →
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

      {/* Install bar */}
      <div className="px-5 py-3.5 border-t border-ds-border-light/30 flex items-center justify-center gap-2.5 bg-ds-offwhite/50">
        <span className="text-sm">📱</span>
        <span className="text-[11px] text-ds-text-muted font-medium">Installer Doc&Score</span>
        <button className="px-3 py-1 rounded-lg bg-ds-sky/8 text-ds-sky text-[10px] font-bold hover:bg-ds-sky/12 transition-colors">
          Installer
        </button>
      </div>
    </div>
  );
}
