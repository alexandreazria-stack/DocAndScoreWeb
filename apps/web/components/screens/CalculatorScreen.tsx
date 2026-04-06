"use client";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Calculator, CalculatorResult } from "@/lib/calculators/types";
import type { Doctor } from "@/lib/types";

// ── Risk bar ──────────────────────────────────────────────────────────────────

function RiskBar({ result, age }: { result: CalculatorResult; age: number }) {
  // Thresholds depend on age group
  const max = 25;
  const thresholds =
    age < 50
      ? [2.5, 7.5]
      : age < 70
      ? [5, 10]
      : [7.5, 15];

  const pct = Math.min((result.riskPercent / max) * 100, 100);
  const t1 = (thresholds[0] / max) * 100;
  const t2 = (thresholds[1] / max) * 100;

  return (
    <div className="mt-4">
      {/* Bar */}
      <div className="relative h-5 rounded-full overflow-hidden"
        style={{ background: "linear-gradient(to right, #2db87d 0%, #e8943a 50%, #e05252 100%)" }}>
        {/* Threshold lines */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{ left: `${t1}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{ left: `${t2}%` }} />
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-md transition-all duration-500"
          style={{ left: `${pct}%`, borderColor: result.color }}
        />
      </div>

      {/* Zone labels */}
      <div className="flex text-[10px] text-ds-text-muted font-medium mt-1.5">
        <span style={{ width: `${t1}%` }}>Faible</span>
        <span style={{ width: `${t2 - t1}%` }}>Modéré</span>
        <span className="flex-1 text-right">Élevé</span>
      </div>

      {/* Seuils */}
      <p className="text-[11px] text-ds-text-muted mt-1">
        Seuils pour les {result.ageGroup} · France — zone risque modéré ESC
      </p>
    </div>
  );
}

// ── Sticky result banner ───────────────────────────────────────────────────────

function ResultBanner({ result, variant }: { result: CalculatorResult | null; variant: string }) {
  if (!result) {
    return (
      <div className="sticky top-0 z-20 glass-strong border-b border-white/40">
        <div className="px-4 py-3 max-w-3xl mx-auto sm:px-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-ds-border-light flex items-center justify-center text-[22px] font-extrabold text-ds-text-muted">
            —
          </div>
          <div>
            <div className="text-[13px] text-ds-text-muted font-semibold">Complétez les 5 paramètres</div>
            <div className="text-[11px] text-ds-text-muted/60">Le résultat s'affiche en temps réel</div>
          </div>
          <div className="ml-auto">
            <span className="text-[11px] font-mono text-ds-text-muted bg-ds-border-light px-2 py-1 rounded-full">{variant}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-20 glass-strong border-b border-white/40 transition-all">
      <div className="px-4 py-3 max-w-3xl mx-auto sm:px-6 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md"
          style={{ background: result.color + "20", border: `2px solid ${result.color}` }}
        >
          <span className="text-[18px] font-extrabold" style={{ color: result.color }}>
            {result.riskLabel}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-ds-text truncate">{result.interpretation}</div>
          <div className="text-[11px] text-ds-text-muted">{result.ageGroup}</div>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: result.color + "18", color: result.color }}
        >
          {result.scoreVariant}
        </span>
      </div>
    </div>
  );
}

// ── Number stepper ─────────────────────────────────────────────────────────────

function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}) {
  const num = parseFloat(value);
  const canDec = !isNaN(num) && (min === undefined || num - step >= min);
  const canInc = !isNaN(num) && (max === undefined || num + step <= max);

  const dec = () => {
    if (!canDec) return;
    const next = Math.round((num - step) * 100) / 100;
    onChange(String(next));
  };
  const inc = () => {
    if (!canInc) return;
    const next = Math.round((num + step) * 100) / 100;
    onChange(String(next));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={dec}
        disabled={!canDec}
        className="w-10 h-10 rounded-full bg-ds-offwhite border border-ds-border/50 text-xl font-bold text-ds-text-secondary disabled:opacity-30 hover:bg-ds-border-light transition-colors active:scale-95"
      >
        −
      </button>
      <div className="flex-1 relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className="w-full text-center text-[22px] font-extrabold text-ds-text bg-ds-offwhite/80 rounded-[14px] border border-ds-border/50 px-3 py-2.5 outline-none focus:border-ds-sky/50 focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ color: value ? "#1a2733" : undefined }}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-ds-text-muted bg-ds-sky/10 text-ds-sky px-1.5 py-0.5 rounded-full">
            {unit}
          </span>
        )}
      </div>
      <button
        onClick={inc}
        disabled={!canInc}
        className="w-10 h-10 rounded-full bg-ds-offwhite border border-ds-border/50 text-xl font-bold text-ds-text-secondary disabled:opacity-30 hover:bg-ds-border-light transition-colors active:scale-95"
      >
        +
      </button>
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function CalculatorScreen({
  calculator,
  doctor,
  onBack,
}: {
  calculator: Calculator;
  doctor: Doctor;
  onBack: () => void;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>({
    smoking: false,
    sex: "",
  });

  // Non-HDL calculator mode
  const [nonHdlMode, setNonHdlMode] = useState<"direct" | "computed">("direct");
  const [totalChol, setTotalChol] = useState("");
  const [hdlChol, setHdlChol] = useState("");
  const [totalCholUnit, setTotalCholUnit] = useState<"mmol" | "g">("mmol");
  const [hdlCholUnit, setHdlCholUnit] = useState<"mmol" | "g">("mmol");
  const [nonHdlUnit, setNonHdlUnit] = useState<"mmol" | "g">("mmol");

  const set = (id: string, val: string | boolean) =>
    setValues((prev) => ({ ...prev, [id]: val }));

  // Compute nonHDL from total + HDL
  const computedNonHdl = useMemo(() => {
    if (nonHdlMode !== "computed") return null;
    const totalMmol =
      totalChol
        ? totalCholUnit === "g"
          ? parseFloat(totalChol) * 2.586
          : parseFloat(totalChol)
        : NaN;
    const hdlMmol =
      hdlChol
        ? hdlCholUnit === "g"
          ? parseFloat(hdlChol) * 2.586
          : parseFloat(hdlChol)
        : NaN;
    if (isNaN(totalMmol) || isNaN(hdlMmol)) return null;
    const v = Math.round((totalMmol - hdlMmol) * 100) / 100;
    return v > 0 ? v : null;
  }, [nonHdlMode, totalChol, hdlChol, totalCholUnit, hdlCholUnit]);

  // Build values for calculation
  const calcValues = useMemo(() => {
    const base = { ...values };
    // For nonHdl, convert from g/L if needed
    if (nonHdlMode === "computed" && computedNonHdl !== null) {
      base.nonHdl = String(computedNonHdl);
    } else if (nonHdlMode === "direct" && base.nonHdl) {
      const raw = parseFloat(base.nonHdl as string);
      if (!isNaN(raw)) {
        base.nonHdl = String(
          nonHdlUnit === "g" ? Math.round(raw * 2.586 * 100) / 100 : raw
        );
      }
    }
    return base;
  }, [values, nonHdlMode, computedNonHdl, nonHdlUnit]);

  const result = useMemo(() => {
    const allFilled = calculator.params.every((p) => {
      if (p.id === "nonHdl") {
        return nonHdlMode === "computed"
          ? computedNonHdl !== null
          : Boolean(calcValues.nonHdl);
      }
      if (p.id === "smoking") return true; // toggle default false is valid
      return Boolean(calcValues[p.id]);
    });
    if (!allFilled) return null;
    return calculator.calculate(calcValues as Record<string, number | string | boolean>);
  }, [calcValues, calculator, computedNonHdl, nonHdlMode]);

  const ageNum = parseInt(String(values.age || "0"));
  const variant = ageNum >= 70 ? "SCORE2-OP" : "SCORE2";

  return (
    <div className="min-h-dvh flex flex-col bg-ambient grain">
      {/* Sticky result banner */}
      <ResultBanner result={result} variant={variant} />

      <div className="flex-1 pb-24 max-w-3xl mx-auto w-full sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-lg text-ds-text-secondary hover:bg-white transition-colors"
          >
            ←
          </button>
          <div>
            <span className="font-mono font-bold text-ds-sky text-[15px]">{calculator.acronym}</span>
            <span className="ml-2 text-[12px] text-ds-text-muted">{calculator.name}</span>
          </div>
          <div className="ml-auto text-[10px] font-bold text-ds-sky bg-ds-sky/10 px-2.5 py-1 rounded-full uppercase tracking-wide">Calculateur</div>
        </div>

        <div className="px-4 space-y-3">
          {/* Params */}
          {calculator.params.map((param) => (
            <div key={param.id} className="ds-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[13px] font-bold text-ds-text">{param.label}</span>
                {param.unit && (
                  <span className="text-[10px] font-bold text-ds-sky bg-ds-sky/10 px-2 py-0.5 rounded-full">
                    {param.id === "nonHdl" && nonHdlMode === "direct" && nonHdlUnit === "g"
                      ? "g/L"
                      : param.unit}
                  </span>
                )}
              </div>

              {param.type === "number" && param.id !== "nonHdl" && (
                <NumberStepper
                  value={String(values[param.id] ?? "")}
                  onChange={(v) => set(param.id, v)}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  unit={param.unit}
                  placeholder={param.placeholder}
                />
              )}

              {param.type === "number" && param.id === "nonHdl" && (
                <>
                  {/* Mode toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setNonHdlMode("direct")}
                      className={`flex-1 py-2 rounded-[10px] text-[12px] font-bold transition-all ${
                        nonHdlMode === "direct"
                          ? "bg-ds-sky text-white"
                          : "bg-ds-offwhite text-ds-text-secondary"
                      }`}
                    >
                      Saisie directe
                    </button>
                    <button
                      onClick={() => setNonHdlMode("computed")}
                      className={`flex-1 py-2 rounded-[10px] text-[12px] font-bold transition-all ${
                        nonHdlMode === "computed"
                          ? "bg-ds-sky text-white"
                          : "bg-ds-offwhite text-ds-text-secondary"
                      }`}
                    >
                      Total + HDL
                    </button>
                  </div>

                  {nonHdlMode === "direct" && (
                    <>
                      {/* g/L ↔ mmol/L toggle */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => setNonHdlUnit(nonHdlUnit === "mmol" ? "g" : "mmol")}
                          className="text-[11px] font-bold text-ds-sky bg-ds-sky/10 px-3 py-1.5 rounded-full hover:bg-ds-sky/20 transition-colors"
                        >
                          {nonHdlUnit === "mmol" ? "→ g/L" : "→ mmol/L"}
                        </button>
                        <span className="text-[11px] text-ds-text-muted">
                          {nonHdlUnit === "g" ? "1 g/L = 2.586 mmol/L" : ""}
                        </span>
                      </div>
                      <NumberStepper
                        value={String(values.nonHdl ?? "")}
                        onChange={(v) => set("nonHdl", v)}
                        min={nonHdlUnit === "g" ? 0.4 : 1}
                        max={nonHdlUnit === "g" ? 4.6 : 12}
                        step={0.1}
                        unit={nonHdlUnit === "g" ? "g/L" : "mmol/L"}
                        placeholder={nonHdlUnit === "g" ? "1.6" : "4.2"}
                      />
                    </>
                  )}

                  {nonHdlMode === "computed" && (
                    <div className="space-y-3">
                      {/* Cholestérol total */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[12px] font-semibold text-ds-text-secondary">Cholestérol total</span>
                          <button
                            onClick={() => setTotalCholUnit(totalCholUnit === "mmol" ? "g" : "mmol")}
                            className="text-[10px] font-bold text-ds-sky bg-ds-sky/10 px-2 py-0.5 rounded-full"
                          >
                            {totalCholUnit === "mmol" ? "mmol/L → g/L" : "g/L → mmol/L"}
                          </button>
                        </div>
                        <NumberStepper
                          value={totalChol}
                          onChange={setTotalChol}
                          min={totalCholUnit === "g" ? 1 : 2.6}
                          max={totalCholUnit === "g" ? 5 : 13}
                          step={0.1}
                          unit={totalCholUnit === "mmol" ? "mmol/L" : "g/L"}
                          placeholder={totalCholUnit === "mmol" ? "5.5" : "2.1"}
                        />
                      </div>

                      {/* HDL */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[12px] font-semibold text-ds-text-secondary">HDL-cholestérol</span>
                          <button
                            onClick={() => setHdlCholUnit(hdlCholUnit === "mmol" ? "g" : "mmol")}
                            className="text-[10px] font-bold text-ds-sky bg-ds-sky/10 px-2 py-0.5 rounded-full"
                          >
                            {hdlCholUnit === "mmol" ? "mmol/L → g/L" : "g/L → mmol/L"}
                          </button>
                        </div>
                        <NumberStepper
                          value={hdlChol}
                          onChange={setHdlChol}
                          min={hdlCholUnit === "g" ? 0.3 : 0.8}
                          max={hdlCholUnit === "g" ? 3 : 7.8}
                          step={0.1}
                          unit={hdlCholUnit === "mmol" ? "mmol/L" : "g/L"}
                          placeholder={hdlCholUnit === "mmol" ? "1.3" : "0.5"}
                        />
                      </div>

                      {/* Computed result */}
                      <div className={`px-4 py-3 rounded-[12px] text-[13px] font-semibold transition-all ${
                        computedNonHdl !== null
                          ? "bg-ds-success/10 text-ds-success border border-ds-success/20"
                          : "bg-ds-border-light text-ds-text-muted"
                      }`}>
                        {computedNonHdl !== null
                          ? `Non-HDL = ${computedNonHdl} mmol/L ✓`
                          : "Non-HDL = — (complétez les champs)"}
                      </div>
                    </div>
                  )}
                </>
              )}

              {param.type === "select" && (
                <div className="flex gap-2">
                  {param.options?.map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => set(param.id, String(opt.value))}
                      className={`flex-1 py-3 rounded-[12px] text-[14px] font-bold transition-all duration-200 ${
                        values[param.id] === opt.value || values[param.id] === String(opt.value)
                          ? "bg-gradient-to-br from-ds-sky/10 to-ds-sky/5 text-ds-sky border border-ds-sky/30 shadow-sm"
                          : "bg-ds-offwhite/80 text-ds-text-secondary hover:bg-ds-offwhite"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {param.type === "toggle" && (
                <button
                  onClick={() => set(param.id, !values[param.id])}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    values[param.id] ? "bg-ds-sky" : "bg-ds-border"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                      values[param.id] ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              )}

              {param.helpText && (
                <p className="text-[11px] text-ds-text-muted mt-2 leading-relaxed">{param.helpText}</p>
              )}
            </div>
          ))}

          {/* Result section */}
          {result && (
            <div className="ds-card p-5 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-md"
                  style={{ background: result.color + "20", border: `2.5px solid ${result.color}` }}
                >
                  <span className="text-[16px] font-extrabold" style={{ color: result.color }}>
                    {result.riskLabel}
                  </span>
                </div>
                <div>
                  <div className="text-[16px] font-extrabold text-ds-text">{result.interpretation}</div>
                  <div className="text-[12px] text-ds-text-muted mt-0.5">
                    Risque CV à 10 ans · {result.scoreVariant}
                  </div>
                </div>
              </div>

              <RiskBar result={result} age={ageNum} />

              {/* Recommandations */}
              <div className="mt-5">
                <div className="text-[11px] font-bold text-ds-text-secondary/60 uppercase tracking-wider mb-2.5">
                  Recommandations ESC
                </div>
                <div className="space-y-2">
                  {result.recommendations.map((r, i) => {
                    const icons = ["💊", "🫀", "🎯", "📅"];
                    return (
                      <div key={i} className="flex items-start gap-2.5 text-[13px] text-ds-text">
                        <span className="text-base shrink-0">{icons[i] ?? "•"}</span>
                        <span>{r}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Détail paramètres */}
              <div className="mt-5 pt-4 border-t border-ds-border-light">
                <div className="text-[11px] font-bold text-ds-text-secondary/60 uppercase tracking-wider mb-2.5">
                  Paramètres saisis
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Âge", value: `${values.age} ans` },
                    { label: "Sexe", value: values.sex === "male" ? "Homme" : "Femme" },
                    { label: "Tabac", value: values.smoking ? "Fumeur" : "Non-fumeur" },
                    { label: "PAS", value: `${values.sbp} mmHg` },
                    {
                      label: "Non-HDL",
                      value:
                        nonHdlMode === "computed" && computedNonHdl !== null
                          ? `${computedNonHdl} mmol/L`
                          : nonHdlUnit === "g"
                          ? `${Math.round(parseFloat(String(values.nonHdl ?? "0")) * 2.586 * 100) / 100} mmol/L`
                          : `${values.nonHdl} mmol/L`,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-ds-offwhite/60 rounded-[10px] px-3 py-2">
                      <div className="text-[10px] text-ds-text-muted font-semibold">{label}</div>
                      <div className="text-[13px] font-bold text-ds-text">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source */}
              <p className="text-[10px] text-ds-text-muted/50 text-center mt-4 leading-relaxed">
                SCORE2 ESC 2021 — Région risque modéré (France){"\n"}
                European Heart Journal 2021;42:2439-2454
              </p>
            </div>
          )}

          {/* Avertissement */}
          <div className="px-4 py-3 rounded-[12px] bg-ds-border-light text-[11px] text-ds-text-muted leading-relaxed">
            ⚠️ Ne s'applique pas aux patients avec ATCD cardiovasculaire, diabète, IRC sévère ou hypercholestérolémie familiale. Outil d'aide à la décision — ne remplace pas le jugement clinique.
          </div>
        </div>
      </div>
    </div>
  );
}
