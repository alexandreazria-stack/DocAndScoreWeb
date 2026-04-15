"use client";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import {
  calculateScore2Diabetes,
  cholGlToMmol,
  cholMmolToGl,
  hba1cMmolToPct,
  hba1cPctToMmol,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  ESC_RECOMMENDATIONS,
  REGION_LABELS,
  type RiskRegion,
  type Score2DiabetesCategory,
  type Sex,
  type SmokingStatus,
} from "@/lib/calculators/score2diabetes";
import type { Doctor } from "@/lib/types";

type CholUnit = "mmol" | "g";
type Hba1cUnit = "mmol" | "pct";

const CATEGORY_ORDER: Score2DiabetesCategory[] = ["low", "moderate", "high", "veryhigh"];

const CATEGORY_RANGES: Record<Score2DiabetesCategory, string> = {
  low:      "< 5 %",
  moderate: "5 – 9,9 %",
  high:     "10 – 19,9 %",
  veryhigh: "≥ 20 %",
};

function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  const num = parseFloat(value);
  const canDec = !isNaN(num) && num - step >= min - 1e-9;
  const canInc = !isNaN(num) && num + step <= max + 1e-9;
  const round = (v: number) => Math.round(v * 1000) / 1000;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => canDec && onChange(String(round(num - step)))}
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
          className="w-full text-center text-[22px] font-extrabold text-ds-text bg-ds-offwhite/80 rounded-[14px] border border-ds-border/50 px-3 py-2.5 outline-none focus:border-ds-sky/50 focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-ds-sky bg-ds-sky/10 px-1.5 py-0.5 rounded-full">
            {unit}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => canInc && onChange(String(round(num + step)))}
        disabled={!canInc}
        className="w-10 h-10 rounded-full bg-ds-offwhite border border-ds-border/50 text-xl font-bold text-ds-text-secondary disabled:opacity-30 hover:bg-ds-border-light transition-colors active:scale-95"
      >
        +
      </button>
    </div>
  );
}

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-3 rounded-[12px] text-[14px] font-bold transition-all duration-200 ${
            value === opt.value
              ? "bg-gradient-to-br from-ds-sky/10 to-ds-sky/5 text-ds-sky border border-ds-sky/30 shadow-sm"
              : "bg-ds-offwhite/80 text-ds-text-secondary hover:bg-ds-offwhite"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Gauge({ risk, color }: { risk: number; color: string }) {
  const pct = Math.min(risk / 40, 1);
  const angle = -90 + pct * 180;
  const r = 80;
  const cx = 100;
  const cy = 100;
  const needleX = cx + r * 0.85 * Math.cos((angle * Math.PI) / 180);
  const needleY = cy + r * 0.85 * Math.sin((angle * Math.PI) / 180);

  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[260px]">
      <defs>
        <linearGradient id="s2dGauge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2db87d" />
          <stop offset="33%" stopColor="#e8b23a" />
          <stop offset="66%" stopColor="#e8803a" />
          <stop offset="100%" stopColor="#e05252" />
        </linearGradient>
      </defs>
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="url(#s2dGauge)"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        style={{ transition: "all 600ms cubic-bezier(0.4, 0, 0.2, 1)" }}
      />
      <circle cx={cx} cy={cy} r="6" fill={color} />
    </svg>
  );
}

export function Score2DiabetesScreen({
  doctor,
  onBack,
}: {
  doctor: Doctor;
  onBack: () => void;
}) {
  // General
  const [sex, setSex] = useState<Sex>("men");
  const [age, setAge] = useState("60");
  const [smoking, setSmoking] = useState<SmokingStatus>("never");
  const [region, setRegion] = useState<RiskRegion>("low");

  // Vascular — stored as mmol/L internally, display unit separately
  const [sbp, setSbp] = useState("140");
  const [cholUnit, setCholUnit] = useState<CholUnit>("mmol");
  const [totalCholDisplay, setTotalCholDisplay] = useState("5.5");
  const [hdlUnit, setHdlUnit] = useState<CholUnit>("mmol");
  const [hdlDisplay, setHdlDisplay] = useState("1.3");

  // Diabetes
  const [diabAge, setDiabAge] = useState("60");
  const [hba1cUnit, setHba1cUnit] = useState<Hba1cUnit>("mmol");
  const [hba1cDisplay, setHba1cDisplay] = useState("50");
  const [egfr, setEgfr] = useState("90");

  // Patient name (local only)
  const [patientName, setPatientName] = useState("");

  const ageNum = parseFloat(age);
  const diabAgeNum = parseFloat(diabAge);
  const sbpNum = parseFloat(sbp);
  const egfrNum = parseFloat(egfr);

  const totalCholMmol = useMemo(() => {
    const v = parseFloat(totalCholDisplay);
    if (isNaN(v)) return NaN;
    return cholUnit === "g" ? cholGlToMmol(v) : v;
  }, [totalCholDisplay, cholUnit]);

  const hdlMmol = useMemo(() => {
    const v = parseFloat(hdlDisplay);
    if (isNaN(v)) return NaN;
    return hdlUnit === "g" ? cholGlToMmol(v) : v;
  }, [hdlDisplay, hdlUnit]);

  const hba1cMmol = useMemo(() => {
    const v = parseFloat(hba1cDisplay);
    if (isNaN(v)) return NaN;
    return hba1cUnit === "pct" ? hba1cPctToMmol(v) : v;
  }, [hba1cDisplay, hba1cUnit]);

  const errors: string[] = [];
  if (!isNaN(ageNum) && (ageNum < 40 || ageNum > 69))
    errors.push("L'âge doit être compris entre 40 et 69 ans.");
  if (!isNaN(ageNum) && !isNaN(diabAgeNum) && diabAgeNum > ageNum)
    errors.push("L'âge au diagnostic DT2 ne peut pas dépasser l'âge actuel.");

  const allValid =
    errors.length === 0 &&
    [ageNum, diabAgeNum, sbpNum, egfrNum, totalCholMmol, hdlMmol, hba1cMmol].every(
      (n) => !isNaN(n),
    );

  const result = useMemo(() => {
    if (!allValid) return null;
    return calculateScore2Diabetes({
      sex,
      age: ageNum,
      smoking,
      sbp: sbpNum,
      totalChol: totalCholMmol,
      hdl: hdlMmol,
      diabAge: diabAgeNum,
      hba1c: hba1cMmol,
      egfr: egfrNum,
      region,
    });
  }, [allValid, sex, ageNum, smoking, sbpNum, totalCholMmol, hdlMmol, diabAgeNum, hba1cMmol, egfrNum, region]);

  const color = result ? CATEGORY_COLORS[result.category] : "#94a3b8";

  const switchCholUnit = (target: CholUnit) => {
    if (target === cholUnit) return;
    const v = parseFloat(totalCholDisplay);
    if (!isNaN(v)) {
      const next = target === "g" ? cholMmolToGl(v) : cholGlToMmol(v);
      setTotalCholDisplay((Math.round(next * 100) / 100).toString());
    }
    setCholUnit(target);
  };

  const switchHdlUnit = (target: CholUnit) => {
    if (target === hdlUnit) return;
    const v = parseFloat(hdlDisplay);
    if (!isNaN(v)) {
      const next = target === "g" ? cholMmolToGl(v) : cholGlToMmol(v);
      setHdlDisplay((Math.round(next * 100) / 100).toString());
    }
    setHdlUnit(target);
  };

  const switchHba1cUnit = (target: Hba1cUnit) => {
    if (target === hba1cUnit) return;
    const v = parseFloat(hba1cDisplay);
    if (!isNaN(v)) {
      const next = target === "pct" ? hba1cMmolToPct(v) : hba1cPctToMmol(v);
      setHba1cDisplay((Math.round(next * 10) / 10).toString());
    }
    setHba1cUnit(target);
  };

  const cholMin = cholUnit === "g" ? 0.5 : 1.5;
  const cholMax = cholUnit === "g" ? 5.8 : 15.0;
  const hdlMin  = hdlUnit  === "g" ? 0.1 : 0.3;
  const hdlMax  = hdlUnit  === "g" ? 1.5 : 4.0;
  const hba1cMin = hba1cUnit === "pct" ? 3.0 : 20;
  const hba1cMax = hba1cUnit === "pct" ? 16.0 : 150;
  const hba1cStep = hba1cUnit === "pct" ? 0.1 : 1;

  const generatePdf = () => {
    if (!result) return;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const W = 595.28;
    const H = 841.89;
    const M = 48; // page margin
    const doctorName = [doctor.title, doctor.firstName, doctor.lastName].filter(Boolean).join(" ");

    const hex = (h: string): [number, number, number] => {
      const n = parseInt(h.replace("#", ""), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    // ── Brand palette (from globals.css)
    const INK       = hex("#152233"); // ds-text
    const INK_SOFT  = hex("#4A6175"); // ds-text-secondary
    const MUTED     = hex("#8899A8"); // ds-text-muted
    const SKY       = hex("#4A9ABF"); // ds-sky
    const SKY_DEEP  = hex("#2F7A9E"); // slightly deepened for contrast
    const SKY_LIGHT = hex("#7BBDD9"); // ds-sky-light
    const SKY_PALE  = hex("#DFF0F8"); // ds-sky-pale
    const SKY_GHOST = hex("#EDF6FB"); // ds-sky-ghost
    const OFFWHITE  = hex("#F4F7F9"); // ds-offwhite
    const LINE      = hex("#E8EDF2"); // ds-border-light
    const catRGB    = hex(CATEGORY_COLORS[result.category]);

    const tracked = (s: string, spacing = 1.2) =>
      s.toUpperCase().split("").join("\u2009".repeat(Math.max(1, Math.round(spacing))));

    // ═════════════════════════════════════════════════════════════════
    // HEADER — soft sky-ghost band, monogram mark, hairline rule
    // ═════════════════════════════════════════════════════════════════
    pdf.setFillColor(...SKY_GHOST);
    pdf.rect(0, 0, W, 110, "F");
    // Two thin decorative rules
    pdf.setDrawColor(...SKY_LIGHT);
    pdf.setLineWidth(0.4);
    pdf.line(M, 110, W - M, 110);
    pdf.setDrawColor(...SKY);
    pdf.setLineWidth(1.2);
    pdf.line(M, 112.5, M + 36, 112.5);

    // Monogram circle — sky filled with white D&S
    pdf.setFillColor(...SKY);
    pdf.circle(M + 16, 52, 16, "F");
    pdf.setFont("helvetica", "bold").setFontSize(12).setTextColor(255, 255, 255);
    pdf.text("D&S", M + 16, 56, { align: "center" });

    // Brand + label
    pdf.setFont("helvetica", "bold").setFontSize(9).setTextColor(...SKY_DEEP);
    pdf.text("DOC  &  SCORE", M + 42, 44);
    pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
    pdf.text("Outil d'aide à la décision  ·  Cardiologie", M + 42, 58);

    // Right side — date + patient/doctor
    const dateStr = new Date()
      .toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
      .toUpperCase();
    pdf.setFont("helvetica", "bold").setFontSize(8).setTextColor(...SKY_DEEP);
    pdf.text(dateStr, W - M, 44, { align: "right" });
    pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...INK);
    if (doctorName) pdf.text(doctorName, W - M, 60, { align: "right" });
    if (patientName) {
      pdf.setTextColor(...MUTED);
      pdf.text(`Patient  ·  ${patientName}`, W - M, 74, { align: "right" });
    }

    // Score acronym vertically on the right edge (editorial flourish)
    pdf.setFont("helvetica", "bold").setFontSize(7).setTextColor(...SKY_LIGHT);
    pdf.text(tracked("SCORE2-DIABETES  ·  ESC 2023", 1), M, 94);

    // ═════════════════════════════════════════════════════════════════
    // HERO — big title, huge ink number, accent chip
    // ═════════════════════════════════════════════════════════════════
    let y = 160;

    pdf.setFont("helvetica", "bold").setFontSize(26).setTextColor(...INK);
    pdf.text("Risque cardiovasculaire", M, y);
    y += 26;
    pdf.setFont("helvetica", "normal").setFontSize(13).setTextColor(...INK_SOFT);
    pdf.text("à 10 ans  —  patient diabétique de type 2", M, y);

    // Section label + hairline
    y += 36;
    pdf.setDrawColor(...SKY_PALE);
    pdf.setLineWidth(0.6);
    pdf.line(M, y, W - M, y);
    y += 18;
    pdf.setFont("helvetica", "bold").setFontSize(7).setTextColor(...SKY);
    pdf.text(tracked("RÉSULTAT", 2), M, y);

    // Big risk number — INK instead of category color (more refined)
    y += 72;
    pdf.setFont("helvetica", "bold").setFontSize(68).setTextColor(...INK);
    const riskText = result.tenYearRisk.toFixed(1).replace(".", ",");
    pdf.text(riskText, M, y);
    const riskWidth = pdf.getTextWidth(riskText);
    pdf.setFontSize(24).setTextColor(...SKY);
    pdf.text("%", M + riskWidth + 8, y);

    // Category chip — vertically centered on the number's cap-height
    const chipX = M + riskWidth + 56;
    const chipY = y - 34;
    const chipLabel = result.categoryLabel.toUpperCase();
    pdf.setFont("helvetica", "bold").setFontSize(9);
    const chipW = pdf.getTextWidth(chipLabel) + 26;
    pdf.setFillColor(catRGB[0], catRGB[1], catRGB[2]);
    pdf.roundedRect(chipX, chipY, chipW, 22, 11, 11, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.text(chipLabel, chipX + chipW / 2, chipY + 14.5, { align: "center" });

    // Profile line — sits comfortably below the number baseline
    pdf.setFont("helvetica", "normal").setFontSize(10).setTextColor(...INK_SOFT);
    const profile =
      `${sex === "men" ? "Homme" : "Femme"}  ·  ${ageNum} ans  ·  ` +
      `${smoking === "current" ? "Fumeur actif" : "Non-fumeur"}  ·  ` +
      `Région ${REGION_LABELS[region].split(" —")[0].toLowerCase()}`;
    pdf.text(profile, chipX, chipY + 54);

    // ── Gauge — sky-themed, aligned on the number's vertical midline
    const gcx = W - M - 54;
    const gcy = y - 22;
    const gr = 48;
    pdf.setLineCap("round");

    // Background track — sky pale
    pdf.setDrawColor(...SKY_PALE);
    pdf.setLineWidth(8);
    const trackSegs = 64;
    for (let i = 0; i < trackSegs; i++) {
      const a1 = Math.PI + (i / trackSegs) * Math.PI;
      const a2 = Math.PI + ((i + 1) / trackSegs) * Math.PI;
      pdf.line(
        gcx + gr * Math.cos(a1), gcy + gr * Math.sin(a1),
        gcx + gr * Math.cos(a2), gcy + gr * Math.sin(a2),
      );
    }
    // Filled portion — from sky to category color, up to current pct
    const pct = Math.min(result.tenYearRisk / 40, 1);
    const fillSegs = Math.max(1, Math.round(trackSegs * pct));
    pdf.setLineWidth(8);
    for (let i = 0; i < fillSegs; i++) {
      const t = i / trackSegs;
      // Blend sky → category color along arc
      const k = Math.min(1, t / Math.max(pct, 0.01));
      const r = Math.round(SKY[0] + k * (catRGB[0] - SKY[0]));
      const g = Math.round(SKY[1] + k * (catRGB[1] - SKY[1]));
      const b = Math.round(SKY[2] + k * (catRGB[2] - SKY[2]));
      pdf.setDrawColor(r, g, b);
      const a1 = Math.PI + (i / trackSegs) * Math.PI;
      const a2 = Math.PI + ((i + 1) / trackSegs) * Math.PI;
      pdf.line(
        gcx + gr * Math.cos(a1), gcy + gr * Math.sin(a1),
        gcx + gr * Math.cos(a2), gcy + gr * Math.sin(a2),
      );
    }
    // Needle endpoint dot
    const na = Math.PI + pct * Math.PI;
    pdf.setFillColor(catRGB[0], catRGB[1], catRGB[2]);
    pdf.circle(gcx + gr * Math.cos(na), gcy + gr * Math.sin(na), 5, "F");
    pdf.setFillColor(255, 255, 255);
    pdf.circle(gcx + gr * Math.cos(na), gcy + gr * Math.sin(na), 2.2, "F");
    // Labels
    pdf.setFont("helvetica", "normal").setFontSize(7).setTextColor(...MUTED);
    pdf.text("0 %", gcx - gr, gcy + 14, { align: "left" });
    pdf.text("40 %+", gcx + gr, gcy + 14, { align: "right" });

    // ═════════════════════════════════════════════════════════════════
    // STRATIFICATION — 4 cells, sky-ghost fills, active = category color
    // ═════════════════════════════════════════════════════════════════
    y = y + 56;
    pdf.setDrawColor(...SKY_PALE);
    pdf.setLineWidth(0.6);
    pdf.line(M, y, W - M, y);
    y += 18;
    pdf.setFont("helvetica", "bold").setFontSize(7).setTextColor(...SKY);
    pdf.text(tracked("STRATIFICATION  ESC  2023", 2), M, y);

    y += 10;
    const stripY = y;
    const stripW = W - 2 * M;
    const gap = 8;
    const cellW = (stripW - 3 * gap) / 4;
    const cats: [Score2DiabetesCategory, string, string][] = [
      ["low",      "Faible",      "< 5 %"],
      ["moderate", "Modéré",      "5 – 9,9 %"],
      ["high",     "Élevé",       "10 – 19,9 %"],
      ["veryhigh", "Très élevé",  "≥ 20 %"],
    ];
    cats.forEach(([cat, label, range], i) => {
      const x = M + i * (cellW + gap);
      const active = cat === result.category;
      const c = hex(CATEGORY_COLORS[cat]);
      if (active) {
        pdf.setFillColor(c[0], c[1], c[2]);
        pdf.roundedRect(x, stripY, cellW, 58, 8, 8, "F");
        // inner glow simulation with a lighter stroke
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold").setFontSize(11);
        pdf.text(label, x + cellW / 2, stripY + 26, { align: "center" });
        pdf.setFont("helvetica", "normal").setFontSize(9);
        pdf.text(range, x + cellW / 2, stripY + 42, { align: "center" });
      } else {
        pdf.setFillColor(...SKY_GHOST);
        pdf.roundedRect(x, stripY, cellW, 58, 8, 8, "F");
        // Left accent stripe in category color — minimal hint
        pdf.setFillColor(c[0], c[1], c[2]);
        pdf.roundedRect(x, stripY, 3, 58, 1.5, 1.5, "F");
        pdf.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
        pdf.text(label, x + cellW / 2, stripY + 26, { align: "center" });
        pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED);
        pdf.text(range, x + cellW / 2, stripY + 42, { align: "center" });
      }
    });

    // ═════════════════════════════════════════════════════════════════
    // PARAMÈTRES — two-column editorial table, sky hairlines
    // ═════════════════════════════════════════════════════════════════
    y = stripY + 58 + 32;
    pdf.setDrawColor(...SKY_PALE);
    pdf.setLineWidth(0.6);
    pdf.line(M, y, W - M, y);
    y += 18;
    pdf.setFont("helvetica", "bold").setFontSize(7).setTextColor(...SKY);
    pdf.text(tracked("PARAMÈTRES  SAISIS", 2), M, y);

    y += 14;

    const params: [string, string][] = [
      ["Sexe",                   sex === "men" ? "Homme" : "Femme"],
      ["Âge",                    `${ageNum} ans`],
      ["Tabagisme",              smoking === "current" ? "Actif" : "Jamais / sevré"],
      ["Région ESC",             REGION_LABELS[region].replace(/ —.*/, "")],
      ["Pression systolique",    `${sbpNum} mmHg`],
      ["Cholestérol total",      `${totalCholMmol.toFixed(2)} mmol/L   (${cholMmolToGl(totalCholMmol).toFixed(2)} g/L)`],
      ["HDL-cholestérol",        `${hdlMmol.toFixed(2)} mmol/L   (${cholMmolToGl(hdlMmol).toFixed(2)} g/L)`],
      ["Âge diagnostic DT2",     `${diabAgeNum} ans`],
      ["HbA1c",                  `${hba1cMmol.toFixed(0)} mmol/mol   (${hba1cMmolToPct(hba1cMmol).toFixed(1)} %)`],
      ["eGFR  (CKD-EPI)",        `${egfrNum} mL/min/1.73m²`],
    ];

    const colW = (W - 2 * M) / 2;
    const rowH = 26;
    params.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const rx = M + col * colW;
      const ry = y + row * rowH;
      // Tiny sky dot bullet
      pdf.setFillColor(...SKY_LIGHT);
      pdf.circle(rx + 2, ry + 9, 1.4, "F");
      // Label
      pdf.setFont("helvetica", "bold").setFontSize(7).setTextColor(...SKY_DEEP);
      pdf.text(tracked(p[0], 1), rx + 10, ry + 10);
      // Value
      pdf.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
      pdf.text(p[1], rx + 10, ry + 22);
    });

    y = y + Math.ceil(params.length / 2) * rowH + 26;

    // ═════════════════════════════════════════════════════════════════
    // RECOMMANDATION — sky-ghost card with category accent stripe
    // ═════════════════════════════════════════════════════════════════
    const recoLines = pdf.splitTextToSize(ESC_RECOMMENDATIONS[result.category], W - 2 * M - 44) as string[];
    const recoH = 40 + recoLines.length * 16;

    pdf.setFillColor(...SKY_GHOST);
    pdf.roundedRect(M, y, W - 2 * M, recoH, 10, 10, "F");
    pdf.setDrawColor(...SKY_PALE);
    pdf.setLineWidth(0.6);
    pdf.roundedRect(M, y, W - 2 * M, recoH, 10, 10, "S");
    // Category accent stripe
    pdf.setFillColor(catRGB[0], catRGB[1], catRGB[2]);
    pdf.roundedRect(M, y, 4, recoH, 2, 2, "F");

    pdf.setFont("helvetica", "bold").setFontSize(7).setTextColor(...SKY_DEEP);
    pdf.text(tracked("RECOMMANDATION  ESC  2023", 2), M + 20, y + 20);
    pdf.setFont("helvetica", "normal").setFontSize(11).setTextColor(...INK);
    recoLines.forEach((ln, i) => pdf.text(ln, M + 20, y + 38 + i * 15));

    // ═════════════════════════════════════════════════════════════════
    // FOOTER — hairline + brand mark
    // ═════════════════════════════════════════════════════════════════
    pdf.setDrawColor(...SKY_PALE);
    pdf.setLineWidth(0.6);
    pdf.line(M, H - 64, W - M, H - 64);

    pdf.setFont("helvetica", "normal").setFontSize(7).setTextColor(...MUTED);
    const disclaimer =
      "Outil d'aide à la décision — ne remplace pas le jugement clinique. " +
      "Applicable aux patients DT2 de 40 à 69 ans, sans ASCVD établie ni atteinte sévère d'organe cible. " +
      "Algorithme : SCORE2-Diabetes (Eur Heart J 2023, DOI 10.1093/eurheartj/ehad260).";
    const discLines = pdf.splitTextToSize(disclaimer, W - 2 * M - 90) as string[];
    discLines.forEach((ln, i) => pdf.text(ln, M, H - 52 + i * 9));

    pdf.setFont("helvetica", "bold").setFontSize(8).setTextColor(...SKY_DEEP);
    pdf.text("docandscore.fr", W - M, H - 30, { align: "right" });
    pdf.setFont("helvetica", "normal").setFontSize(6).setTextColor(...MUTED);
    pdf.text(tracked("GÉNÉRÉ PAR DOC&SCORE", 1), W - M, H - 20, { align: "right" });

    const safeName = (patientName || "patient").replace(/[^a-zA-Z0-9_-]/g, "_");
    pdf.save(`SCORE2-Diabetes_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-ambient grain">
      {/* Sticky result banner */}
      <div className="sticky top-0 z-20 glass-strong border-b border-white/40">
        <div className="px-4 py-3 max-w-3xl mx-auto sm:px-6 flex items-center gap-3">
          {result ? (
            <>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md"
                style={{ background: color + "20", border: `2px solid ${color}` }}
              >
                <span className="text-[15px] font-extrabold" style={{ color }}>
                  {result.tenYearRisk.toFixed(1)}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-ds-text truncate">{result.categoryLabel}</div>
                <div className="text-[11px] text-ds-text-muted">Risque CV 10 ans · DT2</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-ds-border-light flex items-center justify-center text-[18px] font-extrabold text-ds-text-muted">
                —
              </div>
              <div>
                <div className="text-[13px] text-ds-text-muted font-semibold">Complétez les paramètres</div>
                <div className="text-[11px] text-ds-text-muted/60">Le résultat s'affiche en temps réel</div>
              </div>
            </>
          )}
          <span className="ml-auto text-[11px] font-mono text-ds-sky bg-ds-sky/10 px-2 py-1 rounded-full">
            ESC 2023
          </span>
        </div>
      </div>

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
            <span className="font-mono font-bold text-ds-sky text-[15px]">SCORE2-Diabetes</span>
            <span className="ml-2 text-[12px] text-ds-text-muted">Risque CV 10 ans — DT2</span>
          </div>
          <div className="ml-auto text-[10px] font-bold text-ds-sky bg-ds-sky/10 px-2.5 py-1 rounded-full uppercase tracking-wide">
            Calculateur
          </div>
        </div>

        <div className="px-4 space-y-3">
          {/* Patient name */}
          <div className="ds-card p-5">
            <div className="text-[13px] font-bold text-ds-text mb-3">Patient (local uniquement)</div>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Initiales ou nom (non envoyé)"
              className="w-full text-[14px] text-ds-text bg-ds-offwhite/80 rounded-[12px] border border-ds-border/50 px-3 py-2.5 outline-none focus:border-ds-sky/50 focus:bg-white transition-all"
            />
          </div>

          {/* Section 1 — General */}
          <div className="ds-card p-5 space-y-4">
            <div className="text-[11px] font-bold text-ds-text-secondary/60 uppercase tracking-wider">
              Données générales
            </div>

            <div>
              <div className="text-[13px] font-bold text-ds-text mb-2">Sexe</div>
              <ToggleGroup
                value={sex}
                onChange={setSex}
                options={[
                  { value: "men", label: "Homme" },
                  { value: "women", label: "Femme" },
                ]}
              />
            </div>

            <div>
              <div className="text-[13px] font-bold text-ds-text mb-2">Âge</div>
              <NumberStepper value={age} onChange={setAge} min={40} max={69} step={1} unit="ans" />
            </div>

            <div>
              <div className="text-[13px] font-bold text-ds-text mb-2">Tabagisme</div>
              <ToggleGroup
                value={smoking}
                onChange={setSmoking}
                options={[
                  { value: "never", label: "Non" },
                  { value: "current", label: "Actif" },
                ]}
              />
            </div>

            <div>
              <div className="text-[13px] font-bold text-ds-text mb-2">Région ESC</div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as RiskRegion)}
                className="w-full text-[14px] font-semibold text-ds-text bg-ds-offwhite/80 rounded-[12px] border border-ds-border/50 px-3 py-3 outline-none focus:border-ds-sky/50"
              >
                {(Object.keys(REGION_LABELS) as RiskRegion[]).map((k) => (
                  <option key={k} value={k}>
                    {REGION_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2 — Vascular */}
          <div className="ds-card p-5 space-y-4">
            <div className="text-[11px] font-bold text-ds-text-secondary/60 uppercase tracking-wider">
              Bilan vasculaire
            </div>

            <div>
              <div className="text-[13px] font-bold text-ds-text mb-2">Pression artérielle systolique</div>
              <NumberStepper value={sbp} onChange={setSbp} min={80} max={200} step={1} unit="mmHg" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[13px] font-bold text-ds-text">Cholestérol total</div>
                <div className="flex gap-1">
                  {(["mmol", "g"] as CholUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => switchCholUnit(u)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        cholUnit === u ? "bg-ds-sky text-white" : "bg-ds-sky/10 text-ds-sky"
                      }`}
                    >
                      {u === "mmol" ? "mmol/L" : "g/L"}
                    </button>
                  ))}
                </div>
              </div>
              <NumberStepper
                value={totalCholDisplay}
                onChange={setTotalCholDisplay}
                min={cholMin}
                max={cholMax}
                step={cholUnit === "g" ? 0.01 : 0.1}
                unit={cholUnit === "g" ? "g/L" : "mmol/L"}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[13px] font-bold text-ds-text">HDL-cholestérol</div>
                <div className="flex gap-1">
                  {(["mmol", "g"] as CholUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => switchHdlUnit(u)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        hdlUnit === u ? "bg-ds-sky text-white" : "bg-ds-sky/10 text-ds-sky"
                      }`}
                    >
                      {u === "mmol" ? "mmol/L" : "g/L"}
                    </button>
                  ))}
                </div>
              </div>
              <NumberStepper
                value={hdlDisplay}
                onChange={setHdlDisplay}
                min={hdlMin}
                max={hdlMax}
                step={hdlUnit === "g" ? 0.01 : 0.1}
                unit={hdlUnit === "g" ? "g/L" : "mmol/L"}
              />
            </div>
          </div>

          {/* Section 3 — Diabetes */}
          <div className="ds-card p-5 space-y-4">
            <div className="text-[11px] font-bold text-ds-text-secondary/60 uppercase tracking-wider">
              Paramètres diabète
            </div>

            <div>
              <div className="text-[13px] font-bold text-ds-text mb-2">Âge au diagnostic DT2</div>
              <NumberStepper value={diabAge} onChange={setDiabAge} min={20} max={69} step={1} unit="ans" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[13px] font-bold text-ds-text">HbA1c</div>
                <div className="flex gap-1">
                  {(["mmol", "pct"] as Hba1cUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => switchHba1cUnit(u)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        hba1cUnit === u ? "bg-ds-sky text-white" : "bg-ds-sky/10 text-ds-sky"
                      }`}
                    >
                      {u === "mmol" ? "mmol/mol" : "%"}
                    </button>
                  ))}
                </div>
              </div>
              <NumberStepper
                value={hba1cDisplay}
                onChange={setHba1cDisplay}
                min={hba1cMin}
                max={hba1cMax}
                step={hba1cStep}
                unit={hba1cUnit === "pct" ? "%" : "mmol/mol"}
              />
            </div>

            <div>
              <div className="text-[13px] font-bold text-ds-text mb-2">eGFR (CKD-EPI)</div>
              <NumberStepper value={egfr} onChange={setEgfr} min={15} max={120} step={1} unit="mL/min/1.73m²" />
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="ds-card p-4 border border-ds-danger/30 bg-ds-danger/5">
              {errors.map((e, i) => (
                <div key={i} className="text-[12px] font-semibold text-ds-danger">⚠️ {e}</div>
              ))}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="ds-card p-5 animate-fade-in-up">
              <div className="flex flex-col items-center">
                <Gauge risk={result.tenYearRisk} color={color} />
                <div className="mt-2 text-[48px] font-extrabold leading-none" style={{ color }}>
                  {result.tenYearRisk.toFixed(1)}
                  <span className="text-[24px] ml-1">%</span>
                </div>
                <div
                  className="mt-2 text-[14px] font-bold px-3 py-1 rounded-full"
                  style={{ background: color + "18", color }}
                >
                  {result.categoryLabel}
                </div>
              </div>

              {/* Gradient bar */}
              <div className="mt-6">
                <div
                  className="relative h-5 rounded-full overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(to right, #2db87d 0%, #e8b23a 33%, #e8803a 66%, #e05252 100%)",
                  }}
                >
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-md transition-all duration-500"
                    style={{
                      left: `${Math.min((result.tenYearRisk / 40) * 100, 100)}%`,
                      borderColor: color,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-ds-text-muted font-semibold mt-1">
                  <span>0%</span>
                  <span>10%</span>
                  <span>20%</span>
                  <span>30%</span>
                  <span>40%+</span>
                </div>
              </div>

              {/* Stratification */}
              <div className="mt-6">
                <div className="text-[11px] font-bold text-ds-text-secondary/60 uppercase tracking-wider mb-2">
                  Stratification ESC 2023
                </div>
                <div className="space-y-1.5">
                  {CATEGORY_ORDER.map((cat) => {
                    const active = result.category === cat;
                    return (
                      <div
                        key={cat}
                        className={`flex items-center justify-between px-3 py-2 rounded-[10px] transition-all ${
                          active ? "shadow-sm border" : "bg-ds-offwhite/60"
                        }`}
                        style={
                          active
                            ? { background: CATEGORY_COLORS[cat] + "18", borderColor: CATEGORY_COLORS[cat] }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: CATEGORY_COLORS[cat] }}
                          />
                          <span
                            className={`text-[13px] ${active ? "font-extrabold" : "font-semibold text-ds-text-secondary"}`}
                            style={active ? { color: CATEGORY_COLORS[cat] } : undefined}
                          >
                            {CATEGORY_LABELS[cat]}
                          </span>
                        </div>
                        <span
                          className={`text-[12px] font-mono ${active ? "font-bold" : "text-ds-text-muted"}`}
                          style={active ? { color: CATEGORY_COLORS[cat] } : undefined}
                        >
                          {CATEGORY_RANGES[cat]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-6">
                <div className="text-[11px] font-bold text-ds-text-secondary/60 uppercase tracking-wider mb-2">
                  Recommandation ESC 2023
                </div>
                <div
                  className="px-4 py-3 rounded-[12px] text-[13px] leading-relaxed font-semibold"
                  style={{ background: color + "12", color: "#1a2733", borderLeft: `4px solid ${color}` }}
                >
                  {ESC_RECOMMENDATIONS[result.category]}
                </div>
              </div>

              {/* PDF */}
              <button
                type="button"
                onClick={generatePdf}
                className="mt-5 w-full py-3 rounded-[12px] bg-ds-sky text-white text-[14px] font-bold hover:bg-ds-sky/90 active:scale-[0.98] transition-all"
              >
                📄 Générer PDF
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <div className="px-4 py-3 rounded-[12px] bg-ds-border-light text-[11px] text-ds-text-muted leading-relaxed">
            ⚠️ Outil d'aide à la décision. Ne remplace pas le jugement clinique. 40–69 ans, sans ASCVD établie ni atteinte sévère d'organe cible.
          </div>
        </div>
      </div>
    </div>
  );
}
