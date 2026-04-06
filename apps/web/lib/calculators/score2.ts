/**
 * SCORE2 / SCORE2-OP Calculator
 * Systematic COronary Risk Evaluation 2 — ESC 2021
 *
 * Reference: SCORE2 Working Group. European Heart Journal 2021;42(25):2439-2454
 * Reference: SCORE2-OP Group. European Heart Journal 2021;42(25):2455-2467
 *
 * Region: Low-Moderate Risk (France, Belgium, Germany, Austria, Greece...)
 *
 * Algorithm: Cox proportional hazards model with age-centered predictors.
 * Coefficients from Table 1 (Low-Moderate risk region) of the SCORE2 paper.
 * S0(10) values calibrated to reproduce the published risk charts (Figure 4).
 * mean_LP absorbed into S0 (set to 0 for simplicity).
 */

import type { Calculator, CalculatorResult } from "./types";

// ── Coefficients for Low-Moderate risk region ─────────────────────────────────

const COEF_MEN = {
  smoking: 0.6012,
  sbp: 0.2837,       // per (SBP-120)/20
  nonHdl: 0.1267,    // per (nonHDL-5.5)
  ageSmoking: -0.0755,
  ageSbp: -0.0255,
  ageNonHdl: -0.0281,
};

const COEF_WOMEN = {
  smoking: 0.6360,
  sbp: 0.4648,
  nonHdl: 0.1002,
  ageSmoking: -0.0564,
  ageSbp: -0.0233,
  ageNonHdl: -0.0102,
};

// ── Baseline survival S0(10) by age ───────────────────────────────────────────
// Calibrated to ESC 2021 SCORE2 Figure 4 (Low-Moderate risk region, France).
// Reference profile: non-smoker, SBP=120 mmHg, nonHDL=5.5 mmol/L.
// SCORE2-OP values (70-89) are approximations from the SCORE2-OP paper.

const S0_MEN: [number, number][] = [
  [40, 0.9940], [45, 0.9895], [50, 0.9830],
  [55, 0.9737], [60, 0.9600], [65, 0.9400],
  [70, 0.9150], [75, 0.8840], [80, 0.8450], [85, 0.7960],
];

const S0_WOMEN: [number, number][] = [
  [40, 0.9980], [45, 0.9964], [50, 0.9938],
  [55, 0.9893], [60, 0.9815], [65, 0.9670],
  [70, 0.9430], [75, 0.9110], [80, 0.8700], [85, 0.8180],
];

function interpolateS0(table: [number, number][], age: number): number {
  const ages = table.map(([a]) => a);
  const lower = ages.filter((a) => a <= age).pop() ?? ages[0];
  const upper = ages.find((a) => a > age) ?? ages[ages.length - 1];
  const s0Lower = table.find(([a]) => a === lower)![1];
  const s0Upper = table.find(([a]) => a === upper)![1];
  if (lower === upper) return s0Lower;
  const ratio = (age - lower) / (upper - lower);
  return s0Lower + ratio * (s0Upper - s0Lower);
}

// ── Core calculation ──────────────────────────────────────────────────────────

function calcRisk(
  sex: string,
  age: number,
  smoking: boolean,
  sbp: number,
  nonHdl: number,
): number {
  const coef = sex === "male" ? COEF_MEN : COEF_WOMEN;
  const s0Table = sex === "male" ? S0_MEN : S0_WOMEN;

  const ageC = (age - 60) / 5;
  const sbpC = (sbp - 120) / 20;
  const nonHdlC = nonHdl - 5.5;
  const s = smoking ? 1 : 0;

  const lp =
    coef.smoking * s +
    coef.sbp * sbpC +
    coef.nonHdl * nonHdlC +
    coef.ageSmoking * ageC * s +
    coef.ageSbp * ageC * sbpC +
    coef.ageNonHdl * ageC * nonHdlC;

  const s0 = interpolateS0(s0Table, age);
  const s10 = Math.pow(s0, Math.exp(lp));
  return Math.max(0.1, Math.min(99.9, (1 - s10) * 100));
}

// ── Interpretation ────────────────────────────────────────────────────────────

function interpret(risk: number, age: number) {
  if (age < 50) {
    if (risk < 2.5) return { label: "Risque faible", color: "#2db87d", group: "40-49 ans" };
    if (risk < 7.5) return { label: "Risque modéré à élevé", color: "#e8943a", group: "40-49 ans" };
    return { label: "Risque élevé à très élevé", color: "#e05252", group: "40-49 ans" };
  }
  if (age < 70) {
    if (risk < 5) return { label: "Risque faible", color: "#2db87d", group: "50-69 ans" };
    if (risk < 10) return { label: "Risque modéré à élevé", color: "#e8943a", group: "50-69 ans" };
    return { label: "Risque élevé à très élevé", color: "#e05252", group: "50-69 ans" };
  }
  if (risk < 7.5) return { label: "Risque faible à modéré", color: "#2db87d", group: "70-89 ans" };
  if (risk < 15) return { label: "Risque modéré à élevé", color: "#e8943a", group: "70-89 ans" };
  return { label: "Risque élevé à très élevé", color: "#e05252", group: "70-89 ans" };
}

function recommendations(label: string): string[] {
  if (label.includes("faible"))
    return [
      "Conseils hygiéno-diététiques",
      "Pas de traitement médicamenteux en prévention primaire",
    ];
  if (label.includes("modéré"))
    return [
      "Discussion sur les facteurs de risque modifiables",
      "Envisager traitement si facteurs non contrôlés",
      "Objectif LDL-c < 2.6 mmol/L (1 g/L)",
    ];
  return [
    "Traitement par statine recommandé",
    "Contrôle tensionnel actif",
    "Objectif LDL-c < 1.8 mmol/L (0.7 g/L)",
    "Réévaluation à 3-6 mois",
  ];
}

// ── Calculator definition ─────────────────────────────────────────────────────

export const SCORE2_CALCULATOR: Calculator = {
  id: "score2",
  acronym: "SCORE2",
  name: "Risque cardiovasculaire ESC 2021",
  description:
    "Calculateur du risque d'événement cardiovasculaire fatal et non fatal à 10 ans. Applicable en prévention primaire (40-89 ans, sans ATCD CV ni diabète). France = zone risque modéré ESC.",
  icon: "❤️",
  category: "cardio",
  specialties: ["Cardiologie", "Médecine générale", "Endocrinologie"],
  pathology: "Risque cardiovasculaire",
  duration: "2 min",
  isPro: false,
  testType: "calculator",
  patientFacing: false,
  params: [
    {
      id: "age",
      label: "Âge",
      type: "number",
      unit: "ans",
      min: 40,
      max: 89,
      step: 1,
      placeholder: "55",
      helpText: "40–69 ans = SCORE2 · 70–89 ans = SCORE2-OP",
      required: true,
    },
    {
      id: "sex",
      label: "Sexe",
      type: "select",
      options: [
        { label: "Homme", value: "male" },
        { label: "Femme", value: "female" },
      ],
      required: true,
    },
    {
      id: "smoking",
      label: "Fumeur actuel",
      type: "toggle",
      helpText: "Fumeur quotidien ou occasionnel — Ex-fumeur > 1 an = non-fumeur",
      required: true,
    },
    {
      id: "sbp",
      label: "Pression artérielle systolique",
      type: "number",
      unit: "mmHg",
      min: 90,
      max: 200,
      step: 1,
      placeholder: "135",
      helpText: "Moyenne de 2 mesures au repos",
      required: true,
    },
    {
      id: "nonHdl",
      label: "Cholestérol non-HDL",
      type: "number",
      unit: "mmol/L",
      min: 1,
      max: 12,
      step: 0.1,
      placeholder: "4.2",
      helpText: "= Cholestérol total − HDL-cholestérol",
      converter: { label: "g/L → mmol/L", factor: 2.586, altUnit: "g/L" },
      required: true,
    },
  ],
  calculate(values): CalculatorResult | null {
    const age = Number(values.age);
    const sex = String(values.sex || "");
    const smoking = Boolean(values.smoking);
    const sbp = Number(values.sbp);
    const nonHdl = Number(values.nonHdl);

    if (!age || !sex || !sbp || !nonHdl) return null;
    if (age < 40 || age > 89) return null;
    if (sbp < 90 || sbp > 200) return null;
    if (nonHdl < 1 || nonHdl > 12) return null;

    const risk = calcRisk(sex, age, smoking, sbp, nonHdl);
    const rounded = Math.round(risk * 10) / 10;
    const { label, color, group } = interpret(rounded, age);

    return {
      riskPercent: rounded,
      riskLabel: `${rounded.toFixed(1)}%`,
      interpretation: label,
      color,
      ageGroup: group,
      recommendations: recommendations(label),
      scoreVariant: age >= 70 ? "SCORE2-OP" : "SCORE2",
    };
  },
};
