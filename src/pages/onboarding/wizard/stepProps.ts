import type { OnboardingSession } from "../model/types";

/** Props shared by every wizard step body. */
export interface StepProps {
  session: OnboardingSession;
  patch: (updater: (draft: OnboardingSession) => OnboardingSession) => void;
  /** Dot-path → message map from validateSession (e.g. "merchants.0.dba"). */
  fieldErrors: Record<string, string>;
}

/** Show a field error only once the step has been visited before this render. */
export function stepError(
  fieldErrors: Record<string, string>,
  path: string,
  show: boolean
): string | undefined {
  return show ? fieldErrors[path] : undefined;
}
