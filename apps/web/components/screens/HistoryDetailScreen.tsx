"use client";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { InputField } from "@/components/ui/InputField";
import { QUESTIONNAIRES } from "@/lib/questionnaires";
import { formatDateFR, formatTimeFR } from "@/lib/utils/formatDate";
import { COPIED_RESET_MS } from "@/lib/constants";
import type { StoredResult, Doctor } from "@/lib/types";

export function HistoryDetailScreen({
  result: r,
  doctor,
  onBack,
}: {
  result: StoredResult;
  doctor: Doctor;
  onBack: () => void;
}) {
  const [patientName, setPatientName] = useState("");
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [showPdf, setShowPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const test = QUESTIONNAIRES.find((q) => q.id === r.testId);
  const displayScore = test?.scoreMethod === "average" ? Number(r.totalScore.toFixed(1)) : r.totalScore;
  const date = new Date(r.createdAt);

  const handleCopy = async () => {
    const patientLabel = patientName ? `${patientName.toUpperCase()} ${patientFirstName} (${patientDob})` : r.patientInitials ?? "—";
    const text = `${r.testAcronym} — ${patientLabel}\nScore : ${displayScore}/${r.maxScore} — ${r.scoringLabel}\nDate : ${formatDateFR(date)} — ${doctor.title} ${doctor.lastName}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch { /* ignore */ }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflow: "auto", background: "#EAEFF3", zIndex: 9999 }} className="font-display text-ds-text">
      <div className="pb-24 px-4 pt-5 max-w-2xl mx-auto sm:px-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 animate-fade-in-up">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-lg text-ds-text-secondary hover:bg-white transition-colors"
          >
            ←
          </button>
          <span className="font-mono font-bold text-ds-sky text-[15px]">{r.testAcronym}</span>
          <span className="text-[13px] text-ds-text-muted font-medium">{r.testName}</span>
          {r.patientInitials && (
            <span className="ml-auto text-[12px] font-bold text-ds-sky bg-ds-sky/10 px-3 py-1 rounded-full">
              {r.patientInitials}
            </span>
          )}
        </div>

        {/* Score gauge */}
        <div className="ds-card p-6 mb-4 animate-scale-in overflow-hidden relative">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: r.scoringColor }}
          />
          <ScoreGauge score={displayScore} max={r.maxScore} color={r.scoringColor} label={r.scoringLabel} />
          <div className="text-center text-[12px] text-ds-text-muted mt-3 font-medium">
            {formatDateFR(date)} à {formatTimeFR(date)}
            {r.sessionCode && <span className="ml-2 font-mono text-ds-sky">· QR #{r.sessionCode}</span>}
          </div>
        </div>

        {/* Answers breakdown */}
        {test && Object.keys(r.answers ?? {}).length > 0 && (
          <div className="ds-card p-5 mb-4 animate-fade-in-up stagger-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-ds-sky/8 flex items-center justify-center text-base">📋</div>
              <h3 className="text-[15px] font-bold">Réponses par question</h3>
            </div>
            <div className="flex flex-col gap-3">
              {test.questions.map((q, idx) => {
                const val = (r.answers ?? {})[idx];
                if (val === undefined) return null;
                const opt = q.options.find((o) => o.value === val);
                return (
                  <div key={idx} className="flex gap-3 items-start py-2.5 border-b border-ds-border-light/40 last:border-0">
                    <span className="w-6 h-6 rounded-full bg-ds-sky/10 text-ds-sky text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-ds-text-muted leading-relaxed mb-1">{q.text}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[12px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: `${r.scoringColor}12`, color: r.scoringColor }}
                        >
                          {val}
                        </span>
                        <span className="text-[12px] font-semibold text-ds-text">{opt?.label ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Patient identity for PDF */}
        <div className="ds-card p-5 mb-4 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-full bg-ds-sky/8 flex items-center justify-center text-base">👤</div>
            <h3 className="text-[15px] font-bold flex-1">Identité du patient</h3>
            <Badge variant="sky">LOCAL UNIQUEMENT</Badge>
          </div>
          {r.patientInitials && (
            <div className="mb-3 px-3 py-2 rounded-[10px] bg-ds-sky/6 text-ds-sky text-[12px] font-semibold">
              Initiales saisies par le patient : <span className="font-bold tracking-widest">{r.patientInitials}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <InputField value={patientName} onChange={setPatientName} placeholder="Nom" />
            <InputField value={patientFirstName} onChange={setPatientFirstName} placeholder="Prénom" />
            <InputField value={patientDob} onChange={setPatientDob} placeholder="Date de naissance (JJ/MM/AAAA)" />
          </div>
          <div className="flex items-center gap-2 mt-3 px-3.5 py-2.5 rounded-[12px] bg-ds-sky/5 border border-ds-sky/8 text-[11px] text-ds-sky font-medium">
            <span className="text-sm">🔒</span>
            Ces données restent sur votre appareil. Jamais envoyées au serveur.
          </div>
        </div>

        {/* PDF */}
        {!showPdf ? (
          <button
            onClick={() => setShowPdf(true)}
            disabled={!patientName}
            className="w-full py-4 rounded-[16px] text-[15px] font-bold bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white shadow-[0_2px_8px_rgba(74,154,191,0.3)] hover:shadow-[0_4px_12px_rgba(74,154,191,0.35)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none animate-fade-in-up stagger-4"
          >
            📄 Générer le PDF
          </button>
        ) : (
          <div className="animate-fade-in-up">
            <div className="ds-card p-4 mb-4 bg-ds-offwhite/60">
              <div className="text-center mb-2">
                <span className="text-[10px] text-ds-text-muted font-bold uppercase tracking-widest">Aperçu du PDF</span>
              </div>
              <div className="bg-white rounded-[14px] p-6 border border-ds-border/30 text-[13px] leading-7 shadow-sm">
                <div className="text-center mb-4">
                  <Logo size="sm" />
                  <div className="text-[11px] text-ds-text-muted mt-1 font-medium">Compte-rendu de score clinique</div>
                  <div className="h-px bg-gradient-to-r from-transparent via-ds-sky-light to-transparent my-3" />
                </div>
                <div className="text-ds-text-secondary text-[12px] leading-6">
                  <strong className="text-ds-text">Patient :</strong> {patientName.toUpperCase()} {patientFirstName}{r.patientInitials ? ` (initiales : ${r.patientInitials})` : ""}<br />
                  <strong className="text-ds-text">Né(e) le :</strong> {patientDob || "—"}<br />
                  <strong className="text-ds-text">Date :</strong> {formatDateFR(date)} à {formatTimeFR(date)}<br />
                  <strong className="text-ds-text">Praticien :</strong> {doctor.title} {doctor.lastName}
                </div>
                <div
                  className="my-4 p-4 rounded-[12px] text-center"
                  style={{ backgroundColor: `${r.scoringColor}08`, border: `1px solid ${r.scoringColor}15` }}
                >
                  <div className="font-mono font-bold text-ds-sky text-[13px]">{r.testAcronym} — {r.testName}</div>
                  <div className="text-[28px] font-extrabold my-1" style={{ color: r.scoringColor }}>
                    {displayScore} / {r.maxScore}
                  </div>
                  <div className="font-bold text-[13px]" style={{ color: r.scoringColor }}>{r.scoringLabel}</div>
                </div>

                {/* Answers in PDF */}
                {test && Object.keys(r.answers ?? {}).length > 0 && (
                  <div className="mt-4 border-t border-ds-border-light pt-4">
                    <div className="text-[11px] font-bold text-ds-text-secondary uppercase tracking-wide mb-3">Détail des réponses</div>
                    {test.questions.map((q, idx) => {
                      const val = (r.answers ?? {})[idx];
                      if (val === undefined) return null;
                      const opt = q.options.find((o) => o.value === val);
                      return (
                        <div key={idx} className="flex gap-2 text-[11px] mb-1.5">
                          <span className="text-ds-text-muted shrink-0 w-5 text-right">{idx + 1}.</span>
                          <span className="text-ds-text-muted flex-1 truncate">{q.text}</span>
                          <span className="font-bold text-ds-text shrink-0">{val} – {opt?.label ?? "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="text-[9px] text-ds-text-muted text-center mt-4 leading-relaxed">
                  Généré par Doc&Score — docandscore.fr<br />
                  Aucune donnée patient stockée sur nos serveurs.
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3.5 rounded-[14px] bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white text-[13px] font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              >
                🖨️ Imprimer / PDF
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 py-3.5 rounded-[14px] bg-ds-sky/8 text-ds-sky text-[13px] font-bold hover:bg-ds-sky/12 active:scale-[0.98] transition-all"
              >
                {copied ? "✓ Copié !" : "📋 Copier"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
