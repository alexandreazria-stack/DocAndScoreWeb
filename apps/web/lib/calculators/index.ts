export type { Calculator, CalculatorResult, CalculatorParam } from "./types";
export { SCORE2_CALCULATOR } from "./score2";
export { SCORE2_DIABETES_CALCULATOR } from "./score2diabetes";

import { SCORE2_CALCULATOR } from "./score2";
import { SCORE2_DIABETES_CALCULATOR } from "./score2diabetes";
import type { Calculator } from "./types";

export const CALCULATORS: Calculator[] = [SCORE2_CALCULATOR, SCORE2_DIABETES_CALCULATOR];
