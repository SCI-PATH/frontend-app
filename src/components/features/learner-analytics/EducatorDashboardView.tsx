"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { AtRiskFeed } from "@/components/features/learner-analytics/educator/AtRiskFeed";
import { CollapsibleSection } from "@/components/features/learner-analytics/educator/CollapsibleSection";
import { DashboardHeader } from "@/components/features/learner-analytics/educator/DashboardHeader";
import { MasteryMatrix } from "@/components/features/learner-analytics/educator/MasteryMatrix";
import { StudentDeepDive } from "@/components/features/learner-analytics/educator/StudentDeepDive";
import { SummaryMetrics } from "@/components/features/learner-analytics/educator/SummaryMetrics";
import { EDUCATOR_CLASSROOMS_PATH } from "@/lib/auth-routes";
import {
  buildMatrixCsv,
  downloadCsv,
} from "@/lib/educator/exportCsv";
import { countMatrixBands } from "@/lib/educator/bkt";
import { useEducatorDashboardStore } from "@/store/useEducatorDashboardStore";
import { useUserStore } from "@/store/useUserStore";

export function EducatorDashboardView() {
  const classMeta = useEducatorDashboardStore((state) => state.classMeta);
  const teacherClasses = useEducatorDashboardStore((state) => state.teacherClasses);
  const studentIds = useEducatorDashboardStore((state) => state.studentIds);
  const students = useEducatorDashboardStore((state) => state.students);
  const topicIds = useEducatorDashboardStore((state) => state.topicIds);
  const topicCatalog = useEducatorDashboardStore((state) => state.topicCatalog);
  const selectedStudentId = useEducatorDashboardStore(
    (state) => state.selectedStudentId
  );
  const masteryMatrix = useEducatorDashboardStore((state) => state.masteryMatrix);
  const attemptMatrix = useEducatorDashboardStore((state) => state.attemptMatrix);
  const unknownTopicIds = useEducatorDashboardStore(
    (state) => state.unknownTopicIds
  );
  const atRiskAlerts = useEducatorDashboardStore((state) => state.atRiskAlerts);
  const studentProfile = useEducatorDashboardStore((state) => state.studentProfile);
  const isLoadingClasses = useEducatorDashboardStore(
    (state) => state.isLoadingClasses
  );
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
  const loadTeacherClasses = useEducatorDashboardStore(
    (state) => state.loadTeacherClasses
  );
  const refreshDashboard = useEducatorDashboardStore(
    (state) => state.refreshDashboard
  );
  const setActiveClassCode = useUserStore((state) => state.setActiveClassCode);

  useEffect(() => {
    void loadTeacherClasses();
  }, [loadTeacherClasses]);

  const bandCounts = useMemo(
    () => countMatrixBands(masteryMatrix, studentIds, topicIds),
    [masteryMatrix, studentIds, topicIds]
  );

  const selectedRow =
    selectedStudentId !== null
      ? masteryMatrix[selectedStudentId]
      : undefined;

  const handleExportCsv = () => {
    const code = classMeta?.classCode ?? "class";
    const csv = buildMatrixCsv(masteryMatrix, studentIds, topicIds);
    downloadCsv(`sci-path-${code}-mastery-matrix.csv`, csv);
  };

  const handleClassChange = (classCode: string) => {
    setActiveClassCode(classCode);
    void refreshDashboard();
  };

  const hasData = studentIds.length > 0 && topicIds.length > 0;
  const isBootstrapping = isLoadingClasses || (isLoadingDashboard && !hasData);

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5 pb-8">
      <DashboardHeader
        classMeta={classMeta}
        teacherClasses={teacherClasses}
        learnerCount={studentIds.length}
        topicCount={topicIds.length}
        isLoading={isLoadingDashboard || isLoadingClasses}
        lastRefreshedAt={lastRefreshedAt}
        onClassChange={handleClassChange}
        onRefresh={() => void refreshDashboard()}
        onExportCsv={handleExportCsv}
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <p>{error}</p>
          {teacherClasses.length === 0 && !isLoadingClasses ? (
            <Link
              href={EDUCATOR_CLASSROOMS_PATH}
              className="mt-2 inline-flex font-medium underline underline-offset-2"
            >
              Go to Classrooms to create a class
            </Link>
          ) : null}
        </div>
      ) : null}

      {isBootstrapping ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-brand-surface bg-white py-20 text-brand-text/70">
          <Loader2 className="size-5 animate-spin text-brand-primary" />
          Loading classroom analytics…
        </div>
      ) : hasData ? (
        <>
          <SummaryMetrics bands={bandCounts} />

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
                description="Full learner × skill grid for this class. Collapse when you want to focus on alerts or the student deep-dive panel."
                badge={`${studentIds.length} × ${topicIds.length}`}
                defaultOpen={false}
                accent="primary"
              >
                <MasteryMatrix
                  matrix={masteryMatrix}
                  attemptMatrix={attemptMatrix}
                  studentIds={studentIds}
                  students={students}
                  topicIds={topicIds}
                  topicCatalog={topicCatalog}
                  unknownTopicIds={unknownTopicIds}
                  showHeader={false}
                />
              </CollapsibleSection>
            </div>

            <aside className="xl:sticky xl:top-6 xl:max-h-[92vh] xl:self-start xl:overflow-y-auto">
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
