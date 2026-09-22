import { Icon } from "../../../../design-system";
import { STEP_NUMBERS, STEP_ORDER, STEP_TITLES } from "../../model/constants";
import type { StepId } from "../../model/types";
import type { SessionValidation } from "../../model/validateSession";

interface ValidationBannerProps {
  validation: SessionValidation;
  onGoToStep: (stepId: StepId) => void;
}

export default function ValidationBanner({ validation, onGoToStep }: ValidationBannerProps) {
  if (validation.isComplete) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-success/40 bg-success-bg text-success text-sm font-semibold">
        <Icon name="check-circle" size={16} />
        All required fields are complete. Ready to activate.
      </div>
    );
  }

  return (
    <div className="px-4 py-3 rounded-lg border border-warning/40 bg-warning-bg">
      <p className="flex items-center gap-2 text-sm font-bold text-warning mb-2">
        <Icon name="warning" size={16} />
        {validation.issues.length} issue{validation.issues.length === 1 ? "" : "s"} to resolve before
        activation
      </p>
      <ul className="space-y-1.5">
        {STEP_ORDER.filter((s) => validation.byStep[s]?.length).map((stepId) =>
          (validation.byStep[stepId] ?? []).map((issue, i) => (
            <li key={`${stepId}-${i}`} className="flex items-start justify-between gap-4 text-sm">
              <span className="text-dark-grey">{issue.message}</span>
              <button
                type="button"
                onClick={() => onGoToStep(stepId)}
                className="shrink-0 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
              >
                Fix in Step {STEP_NUMBERS[stepId]} — {STEP_TITLES[stepId]}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
