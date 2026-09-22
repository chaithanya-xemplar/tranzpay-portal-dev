import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onboardingStore } from "../model/storage";
import type { OnboardingSession, StepId } from "../model/types";
import { validateSession, type SessionValidation } from "../model/validateSession";

const AUTOSAVE_DELAY_MS = 700;

export interface UseOnboardingSessionResult {
  session: OnboardingSession;
  /** Functional, immutable update; stamps `updatedAt` and schedules autosave. */
  patch: (updater: (draft: OnboardingSession) => OnboardingSession) => void;
  /** Navigate to a step, recording it as visited (drives idle-vs-error status). */
  goToStep: (stepId: StepId) => void;
  isSaving: boolean;
  savedAt: Date | null;
  validation: SessionValidation;
  /** Flush any pending autosave immediately (Save & Exit / close). */
  saveNow: () => void;
}

export function useOnboardingSession(initial: OnboardingSession): UseOnboardingSessionResult {
  const [session, setSession] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(session);
  latestRef.current = session;

  const persist = useCallback((toSave: OnboardingSession) => {
    void onboardingStore.save(toSave).then(() => {
      setIsSaving(false);
      setSavedAt(new Date());
    });
  }, []);

  // Debounced autosave on every session change (including the initial write,
  // so a brand-new draft shows up in the list immediately).
  useEffect(() => {
    setIsSaving(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      persist(session);
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session, persist]);

  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    persist(latestRef.current);
  }, [persist]);

  const patch = useCallback((updater: (draft: OnboardingSession) => OnboardingSession) => {
    setSession((prev) => ({ ...updater(prev), updatedAt: new Date().toISOString() }));
  }, []);

  // The *departing* step is marked visited: a step being filled in for the
  // first time stays calm, but once you leave it its errors show (sidebar
  // status + inline field errors on return).
  const goToStep = useCallback(
    (stepId: StepId) => {
      patch((draft) => ({
        ...draft,
        currentStepId: stepId,
        visitedSteps: draft.visitedSteps.includes(draft.currentStepId)
          ? draft.visitedSteps
          : [...draft.visitedSteps, draft.currentStepId],
      }));
    },
    [patch]
  );

  const validation = useMemo(() => validateSession(session), [session]);

  return { session, patch, goToStep, isSaving, savedAt, validation, saveNow };
}
