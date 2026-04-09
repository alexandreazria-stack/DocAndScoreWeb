export interface ScoringBracket {
  min: number;
  max: number;
  label: string;
  severity: "normal" | "mild" | "moderate" | "severe" | "critical" | "alert" | "very-severe";
  color: string;
  action?: string;
}

export interface AnswerOption {
  value: number;
  label: string;
}

export type QuestionType =
  | "likert"
  | "yesno"
  | "yesno-inverted"
  | "slider"
  | "score"
  | "thi"
  | "choice";

export interface Question {
  text: string;
  type: QuestionType;
  options: AnswerOption[];
  maxPoints: number;
  note?: string;
}

export interface Questionnaire {
  id: string;
  acronym: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  specialties: string[];
  pathology: string;
  duration: string;
  isPro: boolean;
  maxScore: number;
  scoring: ScoringBracket[];
  questions: Question[];
  instruction?: string;
  /** For ACQ-5: score is average, not sum */
  scoreMethod?: "sum" | "average";
}

export interface Doctor {
  title: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email?: string;
}

export interface TestResult {
  test: Questionnaire;
  answers: Record<number, number>;
  totalScore: number;
  scoring: ScoringBracket;
}

export type Screen =
  | "login"
  | "onboarding"
  | "app"
  | "test"
  | "result"
  | "qr"
  | "patient"
  | "calculator";

export type AppTab = "dashboard" | "search" | "settings";
