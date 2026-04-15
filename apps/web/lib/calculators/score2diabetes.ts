/**
 * SCORE2-Diabetes — ESC 2023
 * Source: RiskScorescvd v0.3.1 CRAN, 15_SCORE2-Diabetes_func.R
 * DOI: 10.1093/eurheartj/ehad260
 */

import type { Calculator, CalculatorResult } from "./types";

export type RiskRegion = "low" | "moderate" | "high" | "veryhigh";
export type Sex = "men" | "women";
export type SmokingStatus = "never" | "current";

export interface Score2DiabetesInput {
  sex: Sex;
  age: number;
  smoking: SmokingStatus;
  sbp: number;
  totalChol: number;
  hdl: number;
  diabAge: number;
  hba1c: number;
  egfr: number;
  region: RiskRegion;
}

export type Score2DiabetesCategory = "low" | "moderate" | "high" | "veryhigh";

export interface Score2DiabetesResult {
  tenYearRisk: number;
  category: Score2DiabetesCategory;
  categoryLabel: string;
}

const SCALE: Record<Sex, Record<RiskRegion, { s1: number; s2: number }>> = {
  men: {
    low:      { s1: -0.5699, s2: 0.7476 },
    moderate: { s1: -0.1565, s2: 0.8009 },
    high:     { s1:  0.3207, s2: 0.9360 },
    veryhigh: { s1:  0.5836, s2: 0.8294 },
  },
  women: {
    low:      { s1: -0.7380, s2: 0.7019 },
    moderate: { s1: -0.3143, s2: 0.7701 },
    high:     { s1:  0.5710, s2: 0.9369 },
    veryhigh: { s1:  0.9412, s2: 0.8329 },
  },
};

const S0: Record<Sex, number> = { men: 0.9605, women: 0.9776 };

export const CATEGORY_LABELS: Record<Score2DiabetesCategory, string> = {
  low:      "Risque faible",
  moderate: "Risque modéré",
  high:     "Risque élevé",
  veryhigh: "Risque très élevé",
};

export const CATEGORY_COLORS: Record<Score2DiabetesCategory, string> = {
  low:      "#2db87d",
  moderate: "#e8b23a",
  high:     "#e8803a",
  veryhigh: "#e05252",
};

export const REGION_LABELS: Record<RiskRegion, string> = {
  low:      "Bas — France, UK, Espagne...",
  moderate: "Modéré",
  high:     "Élevé",
  veryhigh: "Très élevé (Europe Est)",
};

export const ESC_RECOMMENDATIONS: Record<Score2DiabetesCategory, string> = {
  low:      "Cible LDL-C non définie. Contrôle des facteurs de risque. Metformine possible.",
  moderate: "Cible LDL-C < 100 mg/dL. Envisager metformine.",
  high:     "Cible LDL-C < 70 mg/dL. Metformine + SGLT2i et/ou GLP-1 RA recommandés. Statine haute intensité.",
  veryhigh: "Cible LDL-C < 55 mg/dL. SGLT2i et/ou GLP-1 RA indiqués d'emblée. Statine haute intensité.",
};

export function calculateScore2Diabetes(input: Score2DiabetesInput): Score2DiabetesResult {
  const { sex, age, smoking, sbp, totalChol, hdl, diabAge, hba1c, egfr, region } = input;

  const ageS     = (age - 60) / 5;
  const sbpS     = (sbp - 120) / 20;
  const cholS    = totalChol - 6;
  const hdlS     = (hdl - 1.3) / 0.5;
  const hba1cS   = (hba1c - 31) / 9.34;
  const lnEgfrS  = (Math.log(egfr) - 4.5) / 0.15;
  const diabAgeS = (diabAge - 50) / 5;
  const smoke    = smoking === "current" ? 1 : 0;
  const diab     = 1;

  let lp: number;

  if (sex === "men") {
    lp =
      ( 0.5368 * ageS) +
      ( 0.4774 * smoke) +
      ( 0.1322 * sbpS) +
      ( 0.6457 * diab) +
      ( 0.1102 * cholS) +
      (-0.1087 * hdlS) +
      (-0.0672 * ageS * smoke) +
      (-0.0268 * ageS * sbpS) +
      (-0.0983 * ageS * diab) +
      (-0.0181 * ageS * cholS) +
      ( 0.0095 * ageS * hdlS) +
      (-0.0998 * diab * diabAgeS) +
      ( 0.0955 * hba1cS) +
      (-0.0591 * lnEgfrS) +
      ( 0.0058 * lnEgfrS * lnEgfrS) +
      (-0.0134 * hba1cS * ageS) +
      ( 0.0115 * lnEgfrS * ageS);
  } else {
    lp =
      ( 0.6624 * ageS) +
      ( 0.6139 * smoke) +
      ( 0.1421 * sbpS) +
      ( 0.8096 * diab) +
      ( 0.1127 * cholS) +
      (-0.1568 * hdlS) +
      (-0.1122 * ageS * smoke) +
      (-0.0167 * ageS * sbpS) +
      (-0.1272 * ageS * diab) +
      (-0.0200 * ageS * cholS) +
      ( 0.0186 * ageS * hdlS) +
      (-0.118  * diab * diabAgeS) +
      ( 0.1173 * hba1cS) +
      (-0.0640 * lnEgfrS) +
      ( 0.0062 * lnEgfrS * lnEgfrS) +
      (-0.0196 * hba1cS * ageS) +
      ( 0.0169 * lnEgfrS * ageS);
  }

  const uncalibrated = 1 - Math.pow(S0[sex], Math.exp(lp));
  const { s1, s2 } = SCALE[sex][region];
  const calibrated = 1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - uncalibrated))));

  const tenYearRisk = Math.round(Math.min(Math.max(calibrated * 100, 0), 100) * 10) / 10;

  const category: Score2DiabetesCategory =
    tenYearRisk < 5  ? "low" :
    tenYearRisk < 10 ? "moderate" :
    tenYearRisk < 20 ? "high" : "veryhigh";

  return { tenYearRisk, category, categoryLabel: CATEGORY_LABELS[category] };
}

// Unit converters
export const cholMmolToGl   = (v: number) => v * 0.3866;
export const cholGlToMmol   = (v: number) => v / 0.3866;
export const hba1cMmolToPct = (v: number) => v * 0.0915 + 2.15;
export const hba1cPctToMmol = (v: number) => (v - 2.15) / 0.0915;

// Registry metadata. `calculate()` is a stub — the dedicated
// Score2DiabetesScreen handles inputs and rendering directly.
export const SCORE2_DIABETES_CALCULATOR: Calculator = {
  id: "score2-diabetes",
  acronym: "SCORE2-Diabetes",
  name: "Risque CV 10 ans — DT2",
  description:
    "Estimation du risque cardiovasculaire à 10 ans chez le patient diabétique de type 2 (40–69 ans) sans ASCVD établie. Recommandé par les guidelines ESC 2023.",
  icon: "🩸",
  category: "cardio",
  specialties: ["Cardiologie", "Endocrinologie", "Médecine générale"],
  pathology: "Risque CV — diabète type 2",
  duration: "3 min",
  isPro: false,
  testType: "calculator",
  patientFacing: false,
  params: [],
  calculate(): CalculatorResult | null {
    return null;
  },
};
