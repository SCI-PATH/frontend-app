import { Navbar } from "@/components/common/Navbar";
import { StudentHome } from "@/components/common/student-home/StudentHome";

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <Navbar />
      <StudentHome />
    </div>
  );
}
