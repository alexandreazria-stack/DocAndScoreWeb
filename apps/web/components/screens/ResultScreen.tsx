"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { Logo } from "@/components/ui/Logo";
import type { TestResult, Doctor } from "@/lib/types";

export function ResultScreen({
  result,
  doctor,
  onBack,
  onHome,
}: {
  result: TestResult;
  doctor: Doctor;
  onBack: () => void;
  onHome: () => void;
}) {
  const { test, totalScore, scoring } = result;
  const [patientName, setPatientName] = useState("");
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [showPdf, setShowPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayScore = test.scoreMethod === "average" ? Number(totalScore.toFixed(1)) : totalScore;

  const handleCopy = () => {
    const text = `${test.acronym} — ${patientName.toUpperCase()} ${patientFirstName} (${patientDob})\nScore : ${displayScore}/${test.maxScore} — ${scoring.label}\nDate : ${new Date().toLocaleDateString("fr-FR")} — ${doctor.title} ${doctor.lastName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const InputField = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-ds-offwhite/80 rounded-[14px] border border-ds-border/50 px-4 py-3.5 text-[14px] font-display text-ds-text placeholder:text-ds-text-muted/50 outline-none focus:border-ds-sky/40 focus:bg-white transition-all duration-200"
    />
  );

  return (
    <div className="pb-20 px-4 bg-ambient grain min-h-dvh max-w-2xl mx-auto sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 animate-fade-in">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-lg text-ds-text-secondary hover:bg-white transition-colors"
        >
          ←
        </button>
        <span className="font-mono font-bold text-ds-sky text-[15px]">{test.acronym}</span>
        <span className="text-[13px] text-ds-text-muted font-medium">Résultats</span>
      </div>

      {/* Score gauge card */}
      <div className="ds-card p-6 mb-4 animate-scale-in overflow-hidden relative">
        {/* Ambient glow in card */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: scoring.color }}
        />
        <ScoreGauge score={displayScore} max={test.maxScore} color={scoring.color} label={scoring.label} />
        {scoring.action && (
          <div
            className="mt-4 px-4 py-3 rounded-[14px] text-[12px] font-semibold text-center leading-relaxed animate-fade-in-up stagger-2"
            style={{
              backgroundColor: `${scoring.color}08`,
              color: scoring.color,
              border: `1px solid ${scoring.color}15`,
            }}
          >
            {scoring.action}
          </div>
        )}
      </div>

      {/* Patient identity */}
      <div className="ds-card p-5 mb-4 animate-fade-in-up stagger-3">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-full bg-ds-sky/8 flex items-center justify-center text-base">👤</div>
          <h3 className="text-[15px] font-bold flex-1">Identité du patient</h3>
          <Badge variant="sky">LOCAL UNIQUEMENT</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <InputField value={patientName} onChange={setPatientName} placeholder="Nom" />
          <InputField value={patientFirstName} onChange={setPatientFirstName} placeholder="Prénom" />
          <InputField value={patientDob} onChange={setPatientDob} placeholder="Date de naissance (JJ/MM/AAAA)" />
        </div>
        <div className="flex items-center gap-2 mt-4 px-3.5 py-2.5 rounded-[12px] bg-ds-sky/5 border border-ds-sky/8 text-[11px] text-ds-sky font-medium">
          <span className="text-sm">🔒</span>
          Ces données restent sur votre appareil. Jamais envoyées au serveur.
        </div>
      </div>

      {!showPdf ? (
        <button
          onClick={() => setShowPdf(true)}
          disabled={!patientName}
          className="w-full py-4 rounded-[16px] text-[15px] font-bold bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white shadow-[0_2px_8px_rgba(74,154,191,0.3),0_8px_24px_rgba(74,154,191,0.15)] hover:shadow-[0_4px_12px_rgba(74,154,191,0.35)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none animate-fade-in-up stagger-4"
        >
          📄 Générer le PDF
        </button>
      ) : (
        <div className="animate-slide-up">
          {/* PDF Preview */}
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
                <strong className="text-ds-text">Patient :</strong> {patientName.toUpperCase()} {patientFirstName}<br />
                <strong className="text-ds-text">Né(e) le :</strong> {patientDob || "—"}<br />
                <strong className="text-ds-text">Date :</strong> {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}<br />
                <strong className="text-ds-text">Praticien :</strong> {doctor.title} {doctor.lastName}
              </div>
              <div
                className="my-4 p-4 rounded-[12px] text-center"
                style={{ backgroundColor: `${scoring.color}08`, border: `1px solid ${scoring.color}15` }}
              >
                <div className="font-mono font-bold text-ds-sky text-[13px]">{test.acronym} — {test.name}</div>
                <div className="text-[28px] font-extrabold my-1" style={{ color: scoring.color }}>
                  {displayScore} / {test.maxScore}
                </div>
                <div className="font-bold text-[13px]" style={{ color: scoring.color }}>{scoring.label}</div>
              </div>
              <div className="text-[9px] text-ds-text-muted text-center mt-4 leading-relaxed">
                Généré par Doc&Score — docandscore.app<br />
                Aucune donnée patient stockée sur nos serveurs.
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <button className="flex-1 py-3.5 rounded-[14px] bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white text-[13px] font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all">
              📄 Télécharger
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 py-3.5 rounded-[14px] bg-ds-sky/8 text-ds-sky text-[13px] font-bold hover:bg-ds-sky/12 active:scale-[0.98] transition-all"
            >
              {copied ? "✓ Copié !" : "📋 Copier"}
            </button>
            <button className="flex-1 py-3.5 rounded-[14px] border border-ds-sky/20 text-ds-sky text-[13px] font-bold hover:bg-ds-sky/5 active:scale-[0.98] transition-all">
              📤 Partager
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 text-center animate-fade-in">
        <button onClick={onHome} className="text-ds-text-muted text-[13px] font-semibold hover:text-ds-text transition-colors">
          ← Retour à l&apos;accueil
        </button>
      </div>
    </div>
  );
}
