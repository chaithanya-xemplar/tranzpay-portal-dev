import { useMemo, type ReactNode } from "react";
import clsx from "clsx";
import Button from "../Button";
import Icon from "../Icon";
import Spinner from "../Spinner";
import type { IconName } from "../Icon";

// ── Types ─────────────────────────────────────────────
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: IconName;
  children?: WizardStep[];
}

export type StepStatus = "idle" | "active" | "complete" | "error";

export interface WizardCallbacks {
  onStepChange: (stepId: string) => void;
  onClose: () => void;
  onSaveExit: () => void;
  onNext: () => void;
  onBack: () => void;
  onActivate?: () => void;
  onToggleJson?: () => void;
}

export interface WizardShellProps extends WizardCallbacks {
  steps: WizardStep[];
  currentStepId: string;
  stepStatus: Record<string, StepStatus>;
  isLastStep?: boolean;
  canActivate?: boolean;
  /** Allow clicking any step in the sidebar, including steps ahead of the current one. */
  allowFreeNavigation?: boolean;
  isSaving?: boolean;
  savedAt?: Date | null;
  title?: string;
  description?: string;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  children: ReactNode;
  showJsonButton?: boolean;
  className?: string;
}

// ── Step numbering ───────────────────────────────────
function buildNumberMap(steps: WizardStep[]): Map<string, string> {
  const map = new Map<string, string>();
  let top = 0;
  for (const step of steps) {
    top++;
    map.set(step.id, String(top));
    if (step.children) {
      const letters = "abcdefghij".split("");
      step.children.forEach((child, i) => {
        map.set(child.id, `${top}${letters[i] ?? "?"}`);
      });
    }
  }
  return map;
}

function flattenSteps(steps: WizardStep[]): WizardStep[] {
  const flat: WizardStep[] = [];
  for (const s of steps) {
    flat.push(s);
    if (s.children) flat.push(...s.children);
  }
  return flat;
}

// ── Progress ─────────────────────────────────────────
function WizardProgress({
  total,
  completed,
}: {
  total: number;
  completed: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="h-1 bg-divider rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Stepper ──────────────────────────────────────────
function WizardStepper({
  steps,
  currentStepId,
  stepStatus,
  numberMap,
  flatSteps,
  onStepChange,
  allowFreeNavigation = false,
}: {
  steps: WizardStep[];
  currentStepId: string;
  stepStatus: Record<string, StepStatus>;
  numberMap: Map<string, string>;
  flatSteps: WizardStep[];
  onStepChange: (id: string) => void;
  allowFreeNavigation?: boolean;
}) {
  const currentIdx = flatSteps.findIndex((s) => s.id === currentStepId);

  const rendered: ReactNode[] = [];

  for (const step of steps) {
    const num = numberMap.get(step.id) ?? "";
    const isComplete = stepStatus[step.id] === "complete";
    const isError = stepStatus[step.id] === "error";
    const isActive = stepStatus[step.id] === "active";
    const idx = flatSteps.findIndex((s) => s.id === step.id);
    const isClickable = allowFreeNavigation || idx <= currentIdx;

    rendered.push(
      <li key={step.id}>
        <button
          type="button"
          disabled={!isClickable}
          onClick={() => isClickable && onStepChange(step.id)}
          className={clsx(
            "group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition border-[1.5px] border-transparent",
            isActive
              ? "bg-onboarding-sidebar-active text-white"
              : isComplete
              ? "text-white hover:bg-white/10"
              : isClickable
              ? "text-light-grey hover:text-white hover:bg-white/10"
              : "text-light-grey cursor-not-allowed opacity-50",
            (isError || (!isComplete && !isActive)) && "border-onboarding-sidebar-border"
          )}
        >
          <span
            className={clsx(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs  shrink-0 border-1 transition",
              isComplete && "bg-success border-success text-white",
              isError && "bg-warning border-warning text-white",
              isActive && "bg-primary border-primary text-white shadow-[0_0_0_4px_var(--color-onboarding-focus-ring)]",
              !isComplete && !isError && !isActive && "bg-white/20 border-white/40 text-light-grey group-hover:text-white"
            )}
          >
            {isComplete ? <Icon name="check" size={12} /> : num}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{step.title}</p>
            {step.description && (
              <p className={clsx(
                "text-[10px] truncate transition-colors",
                isActive || isComplete ? "text-white" : isClickable ? "text-light-grey group-hover:text-white" : "text-light-grey"
              )}>{step.description}</p>
            )}
          </div>
        </button>

        {/* Children / sub-steps */}
        {step.children && step.children.length > 0 && (
          <ul className="ml-10 mt-0.5 space-y-0.5">
            {step.children.map((child) => {
              const childNum = numberMap.get(child.id) ?? "";
              const childComplete = stepStatus[child.id] === "complete";
              const childError = stepStatus[child.id] === "error";
              const childActive = stepStatus[child.id] === "active";
              const childIdx = flatSteps.findIndex((s) => s.id === child.id);
              const childClickable = allowFreeNavigation || childIdx <= currentIdx;

              return (
                <li key={child.id} className="relative pl-5 before:absolute before:left-0 before:top-[-1px] before:h-5 before:w-px before:bg-onboarding-sidebar-border after:absolute after:left-0 after:top-[18px] after:h-px after:w-3 after:bg-onboarding-sidebar-border">
                  <button
                    type="button"
                    disabled={!childClickable}
                    onClick={() => childClickable && onStepChange(child.id)}
                    className={clsx(
                      "group w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition border-[1.5px] border-transparent",
                      childActive
                        ? "bg-onboarding-sidebar-active text-white"
                        : childComplete
                        ? "text-white hover:bg-white/10"
                        : childClickable
                        ? "text-light-grey hover:text-white hover:bg-white/10"
                        : "text-light-grey cursor-not-allowed opacity-50",
                      (childError || (!childComplete && !childActive)) && "border-onboarding-sidebar-border"
                    )}
                  >
                    <span
                      className={clsx(
                        "flex items-center justify-center w-5 h-5 rounded-full text-[10px] shrink-0 border transition",
                        childComplete && "bg-success border-success text-white",
                        childError && "bg-warning border-warning text-white",
                        childActive && "bg-primary border-primary text-white shadow-[0_0_0_4px_var(--color-onboarding-focus-ring)]",
                        !childComplete && !childError && !childActive && "bg-white/20 border-white/40 text-light-grey group-hover:text-white"
                      )}
                    >
                      {childComplete ? <Icon name="check" size={9} /> : childNum}
                    </span>
                    <span className="text-xs truncate">{child.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  return (
    <nav aria-label="Wizard steps">
      <ul className="space-y-0.5">{rendered}</ul>
    </nav>
  );
}

// ── Auto-save label ──────────────────────────────────
function SidebarSaveStatus({ isSaving, savedAt }: { isSaving?: boolean; savedAt?: Date | null }) {
  if (isSaving) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
        <Spinner size="sm" className="border-success border-t-transparent!" />
        Saving…
      </span>
    );
  }
  if (savedAt) {
    const ago = Math.floor((Date.now() - savedAt.getTime()) / 1000);
    const label = ago < 60 ? "just now" : ago < 3600 ? `${Math.floor(ago / 60)}m ago` : `${Math.floor(ago / 3600)}h ago`;
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
        <span className="h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_0_3px_var(--color-onboarding-save-ring)]" />
        Saved {label}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
      <span className="h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_0_3px_var(--color-onboarding-save-ring)]" />
      Not saved
    </span>
  );
}

// ── WizardShell ──────────────────────────────────────
export default function WizardShell({
  steps,
  currentStepId,
  stepStatus,
  onStepChange,
  onClose,
  onSaveExit,
  onNext,
  onBack,
  onActivate,
  onToggleJson,
  isLastStep = false,
  canActivate,
  allowFreeNavigation = false,
  isSaving,
  savedAt,
  title,
  sidebarTitle,
  sidebarSubtitle,
  children,
  showJsonButton = false,
  className,
}: WizardShellProps) {
  const numberMap = useMemo(() => buildNumberMap(steps), [steps]);
  const flatSteps = useMemo(() => flattenSteps(steps), [steps]);
  const currentIdx = flatSteps.findIndex((s) => s.id === currentStepId);
  const totalSteps = flatSteps.length;
  const completedCount = flatSteps.filter((s) => stepStatus[s.id] === "complete").length;
  const currentStep = flatSteps[currentIdx];
  const currentNum = numberMap.get(currentStepId) ?? "";
  const canGoBack = currentIdx > 0;
  const canGoNext = currentIdx < totalSteps - 1;
  const nextStep = canGoNext ? flatSteps[currentIdx + 1] : null;
  const nextStepLabel = nextStep?.title ? `Next: ${nextStep.title}` : "Next";
  const allComplete = flatSteps.every((s) => stepStatus[s.id] === "complete");
  const activationReady = canActivate ?? allComplete;

  // Determine parent context for sub-step header
  const parentStep = steps.find((s) => s.children?.some((c) => c.id === currentStepId));
  const stepLabel = parentStep
    ? `${parentStep.title} • Sub-step ${currentNum}`
    : `Step ${currentNum} of ${totalSteps}`;

  return (
    <div className={clsx("flex h-full bg-white rounded-xl overflow-hidden", className)}>
      {/* Left rail — Stepper */}
      <aside className="w-[320px] shrink-0 bg-[linear-gradient(to_bottom,var(--color-onboarding-sidebar-start),var(--color-onboarding-sidebar-end))] text-white flex flex-col px-4 py-6 transition-all duration-300 overflow-hidden">
        <div className="px-2 pb-5">
          <div className="flex items-center gap-5">
            <span className="text-[7px] font-semibold text-white">tranzpay.io</span>
            <span className="text-[11px] font-bold tracking-widest text-white/80 uppercase">
              {title || "Wizard"}
            </span>
          </div>

          <div className="mt-8">
            <p className="text-[10px] tracking-wider text-light-grey/120 uppercase">
              Onboard Session
            </p>
            <h2 className="mt-1 text-lg font-extrabold leading-none text-white uppercase truncate">
              {sidebarTitle || "New Company"}
            </h2>
            {sidebarSubtitle && (
              <p className="mt-1 text-xs font-semibold text-light-grey">{sidebarSubtitle}</p>
            )}
          </div>

          <div className="mt-4">
            <WizardProgress total={totalSteps} completed={completedCount} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-0 py-2">
          <WizardStepper
            steps={steps}
            currentStepId={currentStepId}
            stepStatus={stepStatus}
            numberMap={numberMap}
            flatSteps={flatSteps}
            onStepChange={onStepChange}
            allowFreeNavigation={allowFreeNavigation}
          />
        </div>

        <div className="mx-2 border-t border-white/10 pt-4">
          <SidebarSaveStatus isSaving={isSaving} savedAt={savedAt} />
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-between rounded-md border border-white/10 bg-onboarding-sidebar-active px-3 py-2 text-left text-xs font-bold text-white/80 transition hover:bg-onboarding-sidebar-active-hover hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Icon name="info" size={14} className="text-white/70" />
              Help &amp; Docs
            </span>
            <Icon name="chevron-right" size={13} className="text-white/35" />
          </button>
        </div>

      </aside>

      {/* Right — Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-divider bg-white shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-light-grey uppercase tracking-wider">
              {stepLabel}
            </p>
            <h1 className="text-base font-bold text-dark-grey mt-0.5 truncate">
              {currentStep?.title || ""}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {showJsonButton && onToggleJson && (
               <Button
              type="button"
              variant="outline"
              onClick={onToggleJson}
            >
                {" { } JSON"}
            </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-light-grey hover:text-dark-grey hover:bg-divider2 transition"
              aria-label="Close wizard"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-background">
          {children}
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-between px-6 py-3 border-t border-divider bg-white shrink-0">
          <div>
            {canGoBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-medium-grey border border-divider rounded-md hover:bg-divider2 transition"
              >
                <Icon name="chevron-left" size={14} />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              icon="save"
              iconPosition="left"
              onClick={onSaveExit}
            >
              Save &amp; Exit
            </Button>

             {isLastStep && onActivate ? (
              <button
                type="button"
                onClick={onActivate}
                disabled={!activationReady}
                className={clsx(
                  "px-5 py-2 text-sm font-semibold rounded-md transition",
                  activationReady
                    ? "bg-primary text-white hover:bg-hover-background"
                    : "bg-divider2 text-light-grey cursor-not-allowed"
                )}
              >
                Activate Merchant
              </button>
            ) : (
              canGoNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-hover-background transition"
                >
                  <span className="truncate">{nextStepLabel}</span>
                  <Icon name="arrow-up" size={14} />
                </button>
              )
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
 
