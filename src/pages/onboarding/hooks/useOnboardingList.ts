import { useCallback, useEffect, useMemo, useState } from "react";
import { STEP_ORDER } from "../model/constants";
import { onboardingStore } from "../model/storage";
import type { OnboardingSession, OnboardingSessionSummary } from "../model/types";
import { validateSession } from "../model/validateSession";

const PROGRESS_STEPS = STEP_ORDER.filter((s) => s !== "review");

function toSummary(session: OnboardingSession): OnboardingSessionSummary {
  const { stepStatus } = validateSession(session);
  return {
    id: session.id,
    status: session.status,
    companyName:
      session.company.legalName.trim() ||
      (session.account.mode === "existing"
        ? session.account.existing?.name ?? ""
        : session.account.newAccount.name.trim()) ||
      "Untitled",
    startedBy: session.startedBy,
    completedSteps: PROGRESS_STEPS.filter((s) => stepStatus[s] === "complete").length,
    totalSteps: PROGRESS_STEPS.length,
    updatedAt: session.updatedAt,
  };
}

export interface UseOnboardingListResult {
  sessions: OnboardingSession[];
  summaries: OnboardingSessionSummary[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

export function useOnboardingList(): UseOnboardingListResult {
  const [sessions, setSessions] = useState<OnboardingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const loaded = await onboardingStore.list();
    setSessions(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const removeSession = useCallback(
    async (id: string) => {
      await onboardingStore.remove(id);
      await refresh();
    },
    [refresh]
  );

  const summaries = useMemo(() => sessions.map(toSummary), [sessions]);

  return { sessions, summaries, isLoading, refresh, removeSession };
}
