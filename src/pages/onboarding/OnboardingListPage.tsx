import { useCallback, useMemo, useState, useEffect, type SVGProps } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Play } from "lucide-react";
import GenericTable from "../../components/table/GenericTable";
import { Button, ConfirmDialog, EmptyState } from "../../design-system";
import { useUserInfo } from "../../services/profile/profileApi";
import type { ApiTableResponse } from "../../types/table";
import { useOnboardingList } from "./hooks/useOnboardingList";
import { createEmptySession, sessionShortCode } from "./model/defaults";
import type { OnboardingSession, OnboardingSessionSummary } from "./model/types";
import OnboardingWizard from "./wizard/OnboardingWizard";

type OnboardingTableRow = OnboardingSessionSummary &
  Record<string, unknown> & {
    sessionCode: string;
  };

const onboardingTableColumns: ApiTableResponse<OnboardingTableRow>["columns"] = [
  { id: "sessionCode", header: "Session ID" },
  { id: "companyName", header: "Company" },
  { id: "startedBy", header: "Started By" },
  { id: "completedSteps", header: "Progress" },
  { id: "updatedAt", header: "Last Updated" },
  { id: "action", header: "Action" },
];

const FilledPlay = (props: SVGProps<SVGSVGElement>) => (
  <Play {...props} fill="currentColor" />
);

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function OnboardingListPage() {
  const { sessions, summaries, isLoading, refresh, removeSession } = useOnboardingList();
  const { data: userInfo } = useUserInfo();
  const [openSession, setOpenSession] = useState<OnboardingSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const tableData = useMemo<OnboardingTableRow[]>(
    () =>
      summaries.map((summary) => ({
        ...summary,
        sessionCode: sessionShortCode(summary.id),
      })),
    [summaries]
  );

  const launchNew = () => {
    setOpenSession(createEmptySession(userInfo?.name ?? "Unknown"));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "1") {
      launchNew();
    }
    // Only run on search change
  }, [location.search]);

  const resume = useCallback((id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) setOpenSession(session);
  }, [sessions]);

  const closeWizard = () => {
    setOpenSession(null);
    void refresh();
    // Remove query param after closing so refresh/visit doesn't re-open
    navigate("/onboarding", { replace: true });
  };

  const columns = useMemo<ColumnDef<OnboardingTableRow>[]>(
    () => [
      {
        accessorKey: "sessionCode",
        header: "Session ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs bg-divider2 text-medium-grey px-2 py-1 rounded">
            {row.original.sessionCode}
          </span>
        ),
      },
      {
        accessorKey: "companyName",
        header: "Company",
        cell: ({ row }) => (
          <span className="font-semibold text-dark-grey">{row.original.companyName}</span>
        ),
      },
      {
        accessorKey: "completedSteps",
        header: "Progress",
        cell: ({ row }) => {
          const completedSteps = row.original.completedSteps;
          const totalSteps = row.original.totalSteps;
          const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

          return (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-divider rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-light-grey tabular-nums">
                {completedSteps}/{totalSteps}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => formatUpdatedAt(row.original.updatedAt),
      },
      {
        id: "action",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            <Button
              size="sm"
              variant="ghost"
              icon="trash"
              onClick={() =>
                setDeleteTarget({ id: row.original.id, name: row.original.companyName })
              }
            >
            </Button>
            <Button
              size="sm"
              variant="primary"
              iconComponent={FilledPlay}
              iconPosition="left"
              onClick={() => resume(row.original.id)}
            >
              {row.original.status === "activated" ? "View" : "Resume"}
            </Button>
          </div>
        ),
      },
    ],
    [resume]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-grey">Onboarding</h1>
          <p className="text-sm text-light-grey mt-1">
            Onboard new companies end to end and resume in-progress sessions.
          </p>
        </div>
        <Button icon="plus" iconPosition="left" onClick={launchNew}>
          Onboard a Company
        </Button>
      </div>

      <div className="bg-white border border-divider rounded overflow-hidden">
        {summaries.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon="layers"
              title={isLoading ? "Loading sessions…" : "No sessions in progress"}
              description={
                isLoading ? "" : 'Click "Onboard a Company" to start a new onboarding session.'
              }
            />
          </div>
        ) : (
          <GenericTable<OnboardingTableRow>
            queryKey={["onboarding-sessions"]}
            title="Onboarding Sessions"
            staticData={tableData}
            staticColumns={onboardingTableColumns}
            customColumns={columns}
            hiddenColumns={["id", "totalSteps"]}
            showSearch={false}
            showExport={false}
            filterableColumns={["sessionCode", "companyName", "startedBy", "completedSteps", "updatedAt"]}
          />
        )}
      </div>

      {openSession && <OnboardingWizard initialSession={openSession} onClose={closeWizard} />}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete onboarding session"
        description={`Delete the onboarding session for "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteTarget) void removeSession(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
