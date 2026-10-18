"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { AtRiskFeed } from "@/components/features/learner-analytics/educator/AtRiskFeed";
import { ClassResearchSummary } from "@/components/features/learner-analytics/educator/ClassResearchSummary";
import { CollapsibleSection } from "@/components/features/learner-analytics/educator/CollapsibleSection";
import { DashboardHeader } from "@/components/features/learner-analytics/educator/DashboardHeader";
import { EnrolledStudents } from "@/components/features/learner-analytics/educator/EnrolledStudents";
import { MasteryMatrix } from "@/components/features/learner-analytics/educator/MasteryMatrix";
import { StudentDeepDive } from "@/components/features/learner-analytics/educator/StudentDeepDive";
import { SummaryMetrics } from "@/components/features/learner-analytics/educator/SummaryMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EDUCATOR_CLASSROOMS_PATH } from "@/lib/auth-routes";
import {
  buildMatrixCsv,
  downloadCsv,
} from "@/lib/educator/exportCsv";
import { countMatrixBands } from "@/lib/educator/bkt";
import { useEducatorDashboardStore } from "@/store/useEducatorDashboardStore";
import { useUserStore } from "@/store/useUserStore";

function DashboardLoadingOverlay({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-2xl border border-brand-primary/20 bg-white px-6 py-16 shadow-sm"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-brand-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 size-56 rounded-full bg-brand-special/10 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
        <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-brand-primary/10">
          <Loader2
            className="size-8 animate-spin text-brand-primary"
            aria-hidden
          />
          <Sparkles
            className="absolute -right-1 -top-1 size-4 text-brand-accent"
            aria-hidden
          />
        </div>
        <p className="text-lg font-semibold text-brand-text">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-text/60">
          {subtitle}
        </p>
        <div className="mt-6 flex w-full max-w-xs gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-primary/25"
              style={{ animationDelay: `${index * 180}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const classSummary = useEducatorDashboardStore((state) => state.classSummary);
  const isLoadingClasses = useEducatorDashboardStore(
    (state) => state.isLoadingClasses
  );
  const isLoadingDashboard = useEducatorDashboardStore(
    (state) => state.isLoadingDashboard
  );
  const isLoadingProfile = useEducatorDashboardStore(
    (state) => state.isLoadingProfile
  );
  const isLoadingClassSummary = useEducatorDashboardStore(
    (state) => state.isLoadingClassSummary
  );
  const error = useEducatorDashboardStore((state) => state.error);
  const profileError = useEducatorDashboardStore((state) => state.profileError);
  const classSummaryError = useEducatorDashboardStore(
    (state) => state.classSummaryError
  );
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
  const [insightTab, setInsightTab] = useState<"classroom" | "learner">(
    "classroom"
  );

  useEffect(() => {
    void loadTeacherClasses();
  }, [loadTeacherClasses]);

  const priorByTopicId = useMemo(() => {
    const priors: Record<string, number> = {};
    for (const topic of topicCatalog) {
      priors[topic.topicId] = topic.pL0;
    }
    return priors;
  }, [topicCatalog]);

  const bandCounts = useMemo(
    () =>
      countMatrixBands(masteryMatrix, studentIds, topicIds, {
        attemptMatrix,
        priorByTopicId,
      }),
    [attemptMatrix, masteryMatrix, priorByTopicId, studentIds, topicIds]
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
    setInsightTab("classroom");
    void refreshDashboard();
  };

  const openLearner = (studentId: string) => {
    setSelectedStudentId(studentId);
    setInsightTab("learner");
  };

  const hasData = studentIds.length > 0 && topicIds.length > 0;
  const isBootstrapping = isLoadingClasses || (isLoadingDashboard && !hasData);
  const isRefreshing = isLoadingDashboard && hasData;

  return (
    <div className="relative mx-auto flex w-full max-w-[1800px] flex-col gap-5 pb-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_top_right,_#7209B714,_transparent_40%),radial-gradient(ellipse_at_bottom,_#70E00012,_transparent_45%)]"
      />
      <div className="relative z-10 flex flex-col gap-5">
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
        <DashboardLoadingOverlay
          title="Preparing your classroom analytics"
          subtitle="Loading enrolled learners, mastery scores, and priority alerts for this class…"
        />
      ) : classMeta ? (
        <>
          {isRefreshing ? (
            <div
              role="status"
              aria-live="polite"
              className="sticky top-2 z-20 flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-white/95 px-4 py-2.5 text-sm text-brand-text shadow-md backdrop-blur"
            >
              <Loader2
                className="size-4 shrink-0 animate-spin text-brand-primary"
                aria-hidden
              />
              <span>
                Refreshing class data
                {classMeta.className ? ` for ${classMeta.className}` : ""}…
              </span>
            </div>
          ) : null}

          {hasData ? (
            <Tabs
              value={insightTab}
              onValueChange={(value) =>
                setInsightTab(value as "classroom" | "learner")
              }
            >
              <TabsList className="mx-auto h-10 w-full max-w-md bg-white p-1 shadow-sm ring-1 ring-brand-surface">
                <TabsTrigger
                  value="classroom"
                  className="h-8 data-[state=active]:bg-brand-primary data-[state=active]:text-white"
                >
                  Classroom
                </TabsTrigger>
                <TabsTrigger
                  value="learner"
                  className="h-8 data-[state=active]:bg-brand-primary data-[state=active]:text-white"
                >
                  Learner
                </TabsTrigger>
              </TabsList>

              <TabsContent value="classroom" className="flex flex-col gap-5">
                <SummaryMetrics
                  bands={bandCounts}
                  frustration={classSummary?.frustration}
                  frustrationLoading={isLoadingClassSummary && !classSummary}
                />

                <CollapsibleSection
                  title="Classroom mastery grid"
                  description="Skills with quiz evidence, with the ones needing the most support on the left. Switch to the full curriculum to see skills nobody has started."
                  badge={`${studentIds.length} learners`}
                  defaultOpen
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
                    gradeLevel={classMeta.gradeLevel}
                    onSelectStudent={openLearner}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Priority follow-up list"
                  description="Learners who may need your help soon."
                  badge={atRiskAlerts.length}
                  defaultOpen
                  accent="danger"
                >
                  <AtRiskFeed
                    alerts={atRiskAlerts}
                    students={students}
                    topicCatalog={topicCatalog}
                    showHeader={false}
                    onSelectStudent={openLearner}
                  />
                </CollapsibleSection>

                <ClassResearchSummary
                  summary={classSummary}
                  isLoading={isLoadingClassSummary}
                  error={classSummaryError}
                />

                <EnrolledStudents
                  students={students}
                  studentIds={studentIds}
                  topicIds={topicIds}
                  classCode={classMeta.classCode}
                  masteryMatrix={masteryMatrix}
                  attemptMatrix={attemptMatrix}
                  priorByTopicId={priorByTopicId}
                  atRiskAlerts={atRiskAlerts}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={openLearner}
                />
              </TabsContent>

              <TabsContent value="learner">
                <StudentDeepDive
                  studentIds={studentIds}
                  students={students}
                  selectedStudentId={selectedStudentId}
                  topicIds={topicIds}
                  matrixRow={selectedRow}
                  attemptMatrix={attemptMatrix}
                  priorByTopicId={priorByTopicId}
                  profile={studentProfile}
                  isLoading={isLoadingProfile}
                  error={profileError}
                  onStudentChange={setSelectedStudentId}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <EnrolledStudents
              students={students}
              studentIds={studentIds}
              topicIds={topicIds}
              classCode={classMeta.classCode}
              masteryMatrix={masteryMatrix}
              attemptMatrix={attemptMatrix}
              priorByTopicId={priorByTopicId}
              atRiskAlerts={atRiskAlerts}
              selectedStudentId={selectedStudentId}
              onSelectStudent={openLearner}
            />
          )}
        </>
      ) : null}
      </div>
    </div>
  );
}
