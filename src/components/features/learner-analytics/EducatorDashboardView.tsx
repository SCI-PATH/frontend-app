"use client";

import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";

import { AtRiskFeed } from "@/components/features/learner-analytics/educator/AtRiskFeed";
import { CollapsibleSection } from "@/components/features/learner-analytics/educator/CollapsibleSection";
import { CurriculumReference } from "@/components/features/learner-analytics/educator/CurriculumReference";
import { DashboardHeader } from "@/components/features/learner-analytics/educator/DashboardHeader";
import { MasteryMatrix } from "@/components/features/learner-analytics/educator/MasteryMatrix";
import { StudentDeepDive } from "@/components/features/learner-analytics/educator/StudentDeepDive";
import { SummaryMetrics } from "@/components/features/learner-analytics/educator/SummaryMetrics";
import {
  buildMatrixCsv,
  downloadCsv,
} from "@/lib/educator/exportCsv";
import { countMatrixBands } from "@/lib/educator/bkt";
import { useEducatorDashboardStore } from "@/store/useEducatorDashboardStore";

export function EducatorDashboardView() {
  const studentIds = useEducatorDashboardStore((state) => state.studentIds);
  const students = useEducatorDashboardStore((state) => state.students);
  const topicIds = useEducatorDashboardStore((state) => state.topicIds);
  const topicCatalog = useEducatorDashboardStore((state) => state.topicCatalog);
  const selectedStudentId = useEducatorDashboardStore(
    (state) => state.selectedStudentId
  );
  const masteryMatrix = useEducatorDashboardStore((state) => state.masteryMatrix);
  const unknownTopicIds = useEducatorDashboardStore(
    (state) => state.unknownTopicIds
  );
  const atRiskAlerts = useEducatorDashboardStore((state) => state.atRiskAlerts);
  const studentProfile = useEducatorDashboardStore((state) => state.studentProfile);
  const isLoadingDashboard = useEducatorDashboardStore(
    (state) => state.isLoadingDashboard
  );
  const isLoadingProfile = useEducatorDashboardStore(
    (state) => state.isLoadingProfile
  );
  const error = useEducatorDashboardStore((state) => state.error);
  const profileError = useEducatorDashboardStore((state) => state.profileError);
  const lastRefreshedAt = useEducatorDashboardStore(
    (state) => state.lastRefreshedAt
  );
  const setSelectedStudentId = useEducatorDashboardStore(
    (state) => state.setSelectedStudentId
  );
  const refreshDashboard = useEducatorDashboardStore(
    (state) => state.refreshDashboard
  );

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const bandCounts = useMemo(
    () => countMatrixBands(masteryMatrix, studentIds, topicIds),
    [masteryMatrix, studentIds, topicIds]
  );

  const selectedRow =
    selectedStudentId !== null
      ? masteryMatrix[selectedStudentId]
      : undefined;

  const handleExportCsv = () => {
    const csv = buildMatrixCsv(masteryMatrix, studentIds, topicIds);
    downloadCsv(`sci-path-mastery-matrix-live.csv`, csv);
  };

  const hasData = studentIds.length > 0 && topicIds.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-8 pb-10">
      <DashboardHeader
        learnerCount={studentIds.length}
        topicCount={topicIds.length}
        isLoading={isLoadingDashboard}
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={() => void refreshDashboard()}
        onExportCsv={handleExportCsv}
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {isLoadingDashboard && !hasData ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-brand-surface bg-white py-20 text-brand-text/70">
          <Loader2 className="size-5 animate-spin text-brand-primary" />
          Loading classroom analytics…
        </div>
      ) : hasData ? (
        <>
          <SummaryMetrics
            studentCount={studentIds.length}
            topicCount={topicIds.length}
            bands={bandCounts}
          />

          <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]">
            <div className="flex min-w-0 flex-col gap-6">
              <CollapsibleSection
                title="Priority At-Risk Intervention Feed"
                description="Learner–skill flags grouped by severity. Expand a card to review mastery, quiz trend, and recommended next steps."
                badge={atRiskAlerts.length}
                defaultOpen
                accent="danger"
              >
                <AtRiskFeed
                  alerts={atRiskAlerts}
                  students={students}
                  topicCatalog={topicCatalog}
                  showHeader={false}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Classroom Mastery Matrix"
                description="Full learner × skill grid. Collapse when you want to focus on alerts or the student deep-dive panel."
                badge={`${studentIds.length} × ${topicIds.length}`}
                defaultOpen={false}
                accent="primary"
              >
                <MasteryMatrix
                  matrix={masteryMatrix}
                  studentIds={studentIds}
                  students={students}
                  topicIds={topicIds}
                  topicCatalog={topicCatalog}
                  unknownTopicIds={unknownTopicIds}
                  showHeader={false}
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Curriculum Mapping & BKT Parameters"
                description="Topic IDs, curriculum titles, and fitted guess/slip parameters from Postgres."
                badge={topicCatalog.length}
                defaultOpen={false}
                accent="special"
              >
                <CurriculumReference
                  topics={topicCatalog}
                  profileParameters={studentProfile?.bkt_parameters}
                  embedded
                />
              </CollapsibleSection>
            </div>

            <aside className="xl:sticky xl:top-6 xl:self-start">
              <StudentDeepDive
                studentIds={studentIds}
                students={students}
                selectedStudentId={selectedStudentId}
                topicIds={topicIds}
                matrixRow={selectedRow}
                profile={studentProfile}
                isLoading={isLoadingProfile}
                error={profileError}
                onStudentChange={setSelectedStudentId}
              />
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
