import { useCallback, useEffect, useState } from "react";
import { Drawer, Icon, WizardShell } from "../../../design-system";
import { useToast } from "../../../design-system/toast/ToastContext";
import { activateSession } from "../../../services/onboarding/onboardingApi";
import { getErrorMessage } from "../../../utils/error";
import { useOnboardingSession } from "../hooks/useOnboardingSession";
import { STEP_DEFS, STEP_ORDER } from "../model/constants";
import { sessionShortCode } from "../model/defaults";
import type { ActivationResult, OnboardingSession, StepId } from "../model/types";
import { buildOnboardingDisplayJson } from "./onboardingRequest";
import AccountStep from "./steps/AccountStep";
import CompanyStep from "./steps/CompanyStep";
import CompletionScreen from "./steps/CompletionScreen";
import MerchantsStep from "./steps/MerchantsStep";
import OwnersStep from "./steps/OwnersStep";
import ProcessingStep from "./steps/ProcessingStep";
import ProfilesStep from "./steps/ProfilesStep";
import ReviewStep from "./steps/ReviewStep";
import UsersStep from "./steps/UsersStep";

interface OnboardingWizardProps {
  initialSession: OnboardingSession;
  /** Called after the wizard closes (session already flushed to storage). */
  onClose: () => void;
}

const STEP_SCHEMA_JSON = JSON.stringify({
  schema: "tranzpay.onboarding.steps/v1",
  steps: [
    { number: "1", id: "account", title: "Account", parent: null, dataKey: "account" },
    { number: "2", id: "corp", title: "Company", parent: null, dataKey: "corp" },
    { number: "3", id: "owners", title: "Owners", parent: null, dataKey: "owners" },
    { number: "4", id: "merchant", title: "Merchants", parent: null, dataKey: "merchants" },
    { number: "4a", id: "processing", title: "Processing", parent: "merchant", dataKey: null },
    { number: "4b", id: "producers", title: "Processing Profiles", parent: "merchant", dataKey: null },
    { number: "5", id: "users", title: "Users", parent: null, dataKey: "users" },
    { number: "6", id: "review", title: "Review & Activate", parent: null, dataKey: null },
  ],
}, null, 2);

export default function OnboardingWizard({ initialSession, onClose }: OnboardingWizardProps) {
  const { session, patch, goToStep, isSaving, savedAt, validation, saveNow } =
    useOnboardingSession(initialSession);
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(
    initialSession.activationResult ?? null
  );
  const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [jsonTab, setJsonTab] = useState<"config" | "schema">("config");

  const currentStepId = session.currentStepId;
  const currentIdx = STEP_ORDER.indexOf(currentStepId);

  const saveAndClose = useCallback(() => {
    saveNow();
    if (!activationResult) {
      toast({
        variant: "info",
        title: "Onboarding session saved",
        description: "Resume anytime from the Onboarding page.",
      });
    }
    onClose();
  }, [saveNow, onClose, toast, activationResult]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isJsonDrawerOpen) saveAndClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveAndClose, isJsonDrawerOpen]);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const result = await activateSession(session);
      setActivationResult(result);
      toast({
        variant: "success",
        title: "Merchant activated",
        description: `${result.companyName} is pending provisioning.`,
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Activation failed",
        description: getErrorMessage(error),
      });
    } finally {
      setIsActivating(false);
    }
  };

  // WizardShell drives status; overlay "active" for the current step.
  const stepStatus = { ...validation.stepStatus, [currentStepId]: "active" as const };

  const stepProps = { session, patch, fieldErrors: validation.fieldErrors };
  const onboardingJson = buildOnboardingDisplayJson(session);
  const displayedJson = jsonTab === "config" ? onboardingJson : STEP_SCHEMA_JSON;
  const sidebarCompanyName = session.company.legalName.trim() || "New Company";

  const copyStepJson = async () => {
    await navigator.clipboard?.writeText(displayedJson);
    setJsonCopied(true);
    window.setTimeout(() => setJsonCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) saveAndClose();
      }}
    >
      <div className="w-[1100px] max-w-7xl h-[92vh] shadow-2xl rounded-xl overflow-hidden">
        {activationResult ? (
          <CompletionScreen session={session} result={activationResult} onClose={onClose} />
        ) : (
          <WizardShell
            steps={STEP_DEFS}
            currentStepId={currentStepId}
            stepStatus={stepStatus}
            allowFreeNavigation
            isLastStep={currentStepId === "review"}
            canActivate={validation.issues.length === 0}
            isSaving={isSaving}
            savedAt={savedAt}
            title="Onboarding"
            description="Onboard a company end to end"
            sidebarTitle={sidebarCompanyName}
            sidebarSubtitle={sessionShortCode(session.id)}
            onStepChange={(id) => goToStep(id as StepId)}
            onNext={() => currentIdx < STEP_ORDER.length - 1 && goToStep(STEP_ORDER[currentIdx + 1])}
            onBack={() => currentIdx > 0 && goToStep(STEP_ORDER[currentIdx - 1])}
            onClose={saveAndClose}
            onSaveExit={saveAndClose}
            onActivate={() => void handleActivate()}
            showJsonButton
            onToggleJson={() => {
              setJsonTab("config");
              setIsJsonDrawerOpen(true);
            }}
          >
            {currentStepId === "account" && <AccountStep {...stepProps} />}
            {currentStepId === "company" && <CompanyStep {...stepProps} />}
            {currentStepId === "owners" && <OwnersStep {...stepProps} />}
            {currentStepId === "merchants" && <MerchantsStep {...stepProps} />}
            {currentStepId === "processing" && <ProcessingStep {...stepProps} />}
            {currentStepId === "profiles" && <ProfilesStep {...stepProps} />}
            {currentStepId === "users" && <UsersStep {...stepProps} />}
            {currentStepId === "review" && (
              <ReviewStep
                session={session}
                validation={validation}
                onGoToStep={goToStep}
                isActivating={isActivating}
              />
            )}
          </WizardShell>
        )}
      </div>

      <Drawer
        open={isJsonDrawerOpen}
        onClose={() => setIsJsonDrawerOpen(false)}
        title="{ } Onboarding JSON"
        subtitle="Developer view - not shown to end users."
        width="w-full max-w-lg"
        className="bg-onboarding-json-panel text-slate-100"
        headerClassName="bg-onboarding-json-panel border-slate-700 [&_h2]:text-slate-100 [&_p]:text-slate-400 [&_button]:text-slate-400 [&_button:hover]:text-white"
        contentClassName="p-0 bg-onboarding-json-content scrollbar-hide"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-700 bg-onboarding-json-panel">
          <div className="flex items-center gap-2" role="tablist" aria-label="Onboarding JSON view">
            <button
              type="button"
              role="tab"
              aria-selected={jsonTab === "config"}
              onClick={() => setJsonTab("config")}
              className={jsonTab === "config" ? "rounded-md bg-onboarding-json-tab px-4 py-2 text-sm font-semibold text-onboarding-json-tab-text" : "rounded-md px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"}
            >
              Config (data)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={jsonTab === "schema"}
              onClick={() => setJsonTab("schema")}
              className={jsonTab === "schema" ? "rounded-md bg-onboarding-json-tab px-4 py-2 text-sm font-semibold text-onboarding-json-tab-text" : "rounded-md px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"}
            >
              Step schema
            </button>
          </div>
          <button
            type="button"
            onClick={() => void copyStepJson()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 transition"
          >
            <Icon name={jsonCopied ? "check" : "copy"} size={14} />
            {jsonCopied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="border-b border-slate-700 px-5 py-3 text-sm text-slate-400">
          {jsonTab === "config" ? (
            <>Live onboarding payload for <strong className="text-slate-200">{session.id}</strong>.</>
          ) : (
            <>Step definitions and their relationship to the onboarding configuration data.</>
          )}
        </div>
        <pre className="m-0 max-h-[calc(100vh-205px)] overflow-auto scrollbar-hide p-5 text-xs leading-6 text-slate-200 whitespace-pre-wrap break-words">{displayedJson}</pre>
      </Drawer>
    </div>
  );
}
