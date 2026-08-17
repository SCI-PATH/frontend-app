import { EducatorDashboardView } from "@/components/features/learner-analytics/EducatorDashboardView";

export const metadata = {
  title: "Educator Insight Dashboard | SCI-PATH",
  description:
    "Classroom mastery matrix, at-risk intervention feed, and learner diagnostics for educators.",
};

export default function EducatorMatrixPage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <EducatorDashboardView />
    </main>
  );
}
