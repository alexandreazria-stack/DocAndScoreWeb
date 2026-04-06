"use client";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import type { Doctor } from "@/lib/types";

const TITLES = ["Dr.", "Pr.", "M.", "Mme"];
const SPECS = [
  { id: "general", label: "Médecine générale", icon: "🩺" },
  { id: "neuro", label: "Neurologie", icon: "🧠" },
  { id: "psy", label: "Psychiatrie", icon: "💭" },
  { id: "geriatrie", label: "Gériatrie", icon: "👴" },
  { id: "orl", label: "ORL", icon: "👂" },
  { id: "urgences", label: "Urgences", icon: "🚑" },
  { id: "algologie", label: "Douleur", icon: "⚡" },
  { id: "pneumo", label: "Pneumologie", icon: "🫁" },
  { id: "uro", label: "Urologie", icon: "🔬" },
  { id: "addictologie", label: "Addictologie", icon: "🛡️" },
  { id: "cardio", label: "Cardiologie", icon: "❤️" },
  { id: "dermato", label: "Dermatologie", icon: "🧴" },
  { id: "rhumato", label: "Rhumatologie", icon: "🦴" },
  { id: "autre", label: "Autre", icon: "📋" },
];

function InputField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-ds-offwhite/80 rounded-[14px] border border-ds-border/50 px-4 py-3.5 text-[15px] font-display text-ds-text placeholder:text-ds-text-muted/50 outline-none focus:border-ds-sky/40 focus:bg-white transition-all"
    />
  );
}

export function OnboardingScreen({ onComplete }: { onComplete: (profile: Doctor) => void }) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("Dr.");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [rpps, setRpps] = useState("");
  const [specialty, setSpecialty] = useState("");

  const canContinue = [lastName && firstName, true, specialty][step];

  return (
    <div className="min-h-dvh bg-ambient grain flex flex-col items-center px-5 pt-10 pb-8">
      {/* Decorative orbs */}
      <div className="absolute top-[10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-ds-sky/[0.06] blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[250px] h-[250px] rounded-full bg-ds-success/[0.04] blur-[60px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="text-center animate-fade-in-up">
          <Logo size="sm" />
          <p className="text-ds-text-muted text-sm mt-2 mb-8 font-medium">Configurez votre profil en 30 secondes</p>
        </div>

        {/* Step dots */}
        <div className="flex gap-2 justify-center mb-7 animate-fade-in-up stagger-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                i <= step ? "bg-ds-sky shadow-sm" : "bg-ds-border"
              }`}
              style={{ width: i === step ? 28 : 8 }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-7 animate-scale-in" key={step}>
          {step === 0 && (
            <>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[24px]">🩺</span>
                <h3 className="text-lg font-extrabold tracking-tight">Votre identité</h3>
              </div>
              <p className="text-ds-text-muted text-[13px] mb-6">Étape 1/3</p>
              <div className="flex gap-2 mb-5">
                {TITLES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTitle(t)}
                    className={`flex-1 py-3 rounded-[12px] text-sm font-bold transition-all duration-200 ${
                      title === t
                        ? "bg-gradient-to-br from-ds-sky/10 to-ds-sky/5 text-ds-sky border border-ds-sky/20 shadow-sm"
                        : "bg-ds-offwhite/80 text-ds-text-secondary hover:bg-ds-offwhite"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <label className="text-[12px] font-bold text-ds-text-secondary/80 uppercase tracking-wider block mb-2">Nom *</label>
              <InputField value={lastName} onChange={setLastName} placeholder="Martin" />
              <div className="h-3.5" />
              <label className="text-[12px] font-bold text-ds-text-secondary/80 uppercase tracking-wider block mb-2">Prénom *</label>
              <InputField value={firstName} onChange={setFirstName} placeholder="Jean" />
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[24px]">📧</span>
                <h3 className="text-lg font-extrabold tracking-tight">Vos coordonnées</h3>
              </div>
              <p className="text-ds-text-muted text-[13px] mb-6">Étape 2/3</p>
              <label className="text-[12px] font-bold text-ds-text-secondary/80 uppercase tracking-wider block mb-2">
                Téléphone <span className="text-ds-text-muted/60 font-normal normal-case">(optionnel)</span>
              </label>
              <InputField value={phone} onChange={setPhone} placeholder="06 12 34 56 78" />
              <div className="h-3.5" />
              <label className="text-[12px] font-bold text-ds-text-secondary/80 uppercase tracking-wider block mb-2">
                N° RPPS <span className="text-ds-text-muted/60 font-normal normal-case">(optionnel)</span>
              </label>
              <InputField value={rpps} onChange={setRpps} placeholder="12345678901" />
              <div className="flex items-center gap-2 mt-5 px-4 py-3 rounded-[14px] bg-ds-sky/5 border border-ds-sky/8 text-[12px] text-ds-sky font-medium">
                🔒 Données stockées de manière sécurisée
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[24px]">🏥</span>
                <h3 className="text-lg font-extrabold tracking-tight">Votre spécialité</h3>
              </div>
              <p className="text-ds-text-muted text-[13px] mb-5">Étape 3/3 — Personnalise vos tests recommandés</p>
              <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto hide-scrollbar">
                {SPECS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setSpecialty(s.id)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-[14px] text-[12px] font-semibold transition-all duration-200 animate-fade-in-up ${
                      specialty === s.id
                        ? "bg-gradient-to-br from-ds-sky/10 to-ds-sky/5 text-ds-sky border border-ds-sky/20 shadow-sm scale-[1.04]"
                        : "bg-ds-offwhite/60 text-ds-text-secondary hover:bg-ds-offwhite"
                    }`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span className="text-[26px]">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6 animate-fade-in-up stagger-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-3.5 rounded-[14px] text-ds-text-secondary text-sm font-semibold hover:bg-white/60 transition-all"
            >
              ← Retour
            </button>
          )}
          <button
            onClick={() => {
              if (step < 2) setStep((s) => s + 1);
              else onComplete({ title, lastName, firstName, specialty });
            }}
            disabled={!canContinue}
            className="flex-1 py-4 rounded-[16px] text-[15px] font-bold bg-gradient-to-r from-ds-sky to-[#3D8DB5] text-white shadow-[0_2px_8px_rgba(74,154,191,0.3),0_8px_24px_rgba(74,154,191,0.15)] hover:shadow-[0_4px_12px_rgba(74,154,191,0.35)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
          >
            {step === 2 ? "Commencer" : "Continuer →"}
          </button>
        </div>
      </div>
    </div>
  );
}
