import { Navbar } from "@/components/common/Navbar";
import { StudentProfileView } from "@/components/features/learner-analytics/StudentProfileView";

export const metadata = {
  title: "My Profile | SCI-PATH",
  description: "Your science mastery, enrolled class, and skills to practise.",
};

export default function StudentProfilePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <Navbar />
      <StudentProfileView />
    </div>
  );
}
