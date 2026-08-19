import { EducatorDashboardView } from "@/components/features/learner-analytics/EducatorDashboardView";

export const metadata = {
  title: "Educator Analytics | SCI-PATH",
  description:
    "Classroom mastery overview, at-risk intervention feed, and learner diagnostics for educators.",
};

export default function EducatorAnalyticsPage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <EducatorDashboardView />
    </main>
  );
}
