"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getScoring, calculateScore } from "@/lib/questionnaires";
import type { Questionnaire, TestResult } from "@/lib/types";

export function TestScreen({
  test,
  onBack,
  onResult,
}: {
  test: Questionnaire;
  onBack: () => void;
  onResult: (result: TestResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const totalScore = calculateScore(test, answers);
  const answered = Object.keys(answers).length;
  const total = test.questions.length;
  const allAnswered = answered === total;
  const isSlider = test.questions[0]?.type === "slider";
  const [sliderValue, setSliderValue] = useState(5);

  const handleSubmit = () => {
    const score = isSlider ? sliderValue : totalScore;
    const finalAnswers = isSlider ? { 0: sliderValue } : answers;
    onResult({ test, answers: finalAnswers, totalScore: score, scoring: getScoring(test, score) });
  };

  const displayScore = isSlider
    ? sliderValue
    : test.scoreMethod === "average"
    ? totalScore.toFixed(1)
    : totalScore;

  return (
    <div className="min-h-dvh flex flex-col bg-ds-bg grain">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 glass-strong border-b border-white/40">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-ds-offwhite/80 flex items-center justify-center text-lg text-ds-text-secondary hover:bg-ds-border-light transition-colors"
            >
              ←
            </button>
            <span className="font-mono font-bold text-ds-sky text-[15px]">{test.acronym}</span>
            <Badge variant="sky">MÉDECIN</Badge>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[30px] font-extrabold text-ds-sky tracking-tight leading-none">
                {displayScore}
              </span>
              <span className="text-[13px] text-ds-text-muted font-medium">/{test.maxScore}</span>
            </div>
          </div>
        </div>
        <ProgressBar value={isSlider ? 1 : answered} max={total} />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-5 pb-28 bg-ambient">
        <div className="animate-fade-in-up">
          <h2 className="text-[18px] font-extrabold mb-1 tracking-tight">{test.name}</h2>
          <p className="text-ds-text-muted text-[13px] mb-5">{test.description} · {test.duration}</p>
        </div>

        {test.instruction && (
          <div className="animate-fade-in-up stagger-1 ds-card px-4 py-3 mb-6 flex items-center gap-2.5 border-ds-sky/10">
            <div className="w-7 h-7 rounded-full bg-ds-sky/10 flex items-center justify-center text-xs">📋</div>
            <span className="text-ds-sky text-[12px] font-semibold">{test.instruction}</span>
          </div>
        )}

        {isSlider ? (
          <div className="ds-card p-7 text-center animate-scale-in">
            <p className="text-[15px] font-semibold mb-8 leading-relaxed">{test.questions[0].text}</p>
            <div
              className="text-[64px] font-extrabold mb-6 transition-colors duration-300"
              style={{ color: sliderValue <= 3 ? "#2FAF7E" : sliderValue <= 6 ? "#D99A3E" : "#D14F4F" }}
            >
              {sliderValue}
            </div>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="10"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-[11px] text-ds-text-muted mt-3 font-medium px-1">
              <span>Aucune douleur</span>
              <span>Douleur maximale</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {test.questions.map((q, idx) => {
              const isAnswered = answers[idx] !== undefined;
              return (
                <div
                  key={idx}
                  className={`ds-card p-4 transition-all duration-300 animate-fade-in-up ${
                    isAnswered
                      ? "border-ds-sky/20 glow-sky"
                      : ""
                  }`}
                  style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
                >
                  <div className="flex gap-2.5 mb-3">
                    <span className={`font-mono text-[11px] font-bold mt-0.5 px-2 py-0.5 rounded-md ${
                      isAnswered ? "bg-ds-sky text-white" : "bg-ds-sky/10 text-ds-sky"
                    }`}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] font-semibold leading-relaxed">{q.text}</span>
                  </div>

                  {q.note && (
                    <p className="text-[11px] text-ds-text-muted mb-3 ml-10 italic opacity-70">{q.note}</p>
                  )}

                  {q.type === "score" ? (
                    <div className="flex gap-1.5 flex-wrap ml-10">
                      {q.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setAnswers((a) => ({ ...a, [idx]: opt.value }))}
                          className={`w-10 h-10 rounded-[10px] text-[13px] font-bold transition-all duration-200 ${
                            answers[idx] === opt.value
                              ? "bg-gradient-to-br from-ds-sky to-[#3D8DB5] text-white shadow-md scale-110"
                              : "bg-ds-offwhite/80 text-ds-text-secondary hover:bg-ds-sky/8"
                          }`}
                        >
                          {opt.value}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 ml-0">
                      {q.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setAnswers((a) => ({ ...a, [idx]: opt.value }))}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] text-[13px] text-left transition-all duration-200 ${
                            answers[idx] === opt.value
                              ? "bg-gradient-to-r from-ds-sky/10 to-ds-sky/5 text-ds-sky font-bold border border-ds-sky/20 shadow-sm"
                              : "bg-ds-offwhite/60 text-ds-text-secondary hover:bg-ds-offwhite"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 transition-all duration-200 ${
                              answers[idx] === opt.value
                                ? "bg-ds-sky text-white shadow-sm"
                                : "bg-ds-border/60 text-ds-text-muted"
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
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-4 pt-4 pb-6 bg-gradient-to-t from-ds-bg via-ds-bg/95 to-transparent">
        <button
          onClick={handleSubmit}
          disabled={!isSlider && !allAnswered}
          className={`
            w-full py-4 rounded-[16px] text-[15px] font-bold
            transition-all duration-200 active:scale-[0.98]
            disabled:opacity-30 disabled:pointer-events-none
            ${allAnswered || isSlider
              ? "bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white shadow-[0_2px_8px_rgba(74,154,191,0.3),0_8px_24px_rgba(74,154,191,0.15)] hover:shadow-[0_4px_12px_rgba(74,154,191,0.35),0_12px_32px_rgba(74,154,191,0.2)] hover:-translate-y-0.5"
              : "bg-ds-border-light text-ds-text-muted"
            }
          `}
        >
          {allAnswered || isSlider
            ? "Voir les résultats →"
            : `${answered}/${total} questions répondues`}
        </button>
      </div>
    </div>
  );
}
