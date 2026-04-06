export interface CalculatorParam {
  id: string;
  label: string;
  type: "number" | "select" | "toggle";
  unit?: string;
  options?: { label: string; value: string | number }[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number | string;
  placeholder?: string;
  helpText?: string;
  converter?: {
    label: string;
    factor: number;
    altUnit: string;
  };
  required: boolean;
}

export interface CalculatorResult {
  riskPercent: number;
  riskLabel: string;
  interpretation: string;
  color: string;
  ageGroup: string;
  recommendations: string[];
  scoreVariant: string;
}

export interface Calculator {
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
  testType: "calculator";
  patientFacing: boolean;
  params: CalculatorParam[];
  calculate: (values: Record<string, number | string | boolean>) => CalculatorResult | null;
}
