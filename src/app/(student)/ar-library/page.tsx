import { Navbar } from "@/components/common/Navbar";
import { ArLibraryHub } from "@/components/features/learning-path-engine/ar-library/ArLibraryHub";

export const metadata = {
  title: "AR Library | SCI-PATH",
  description: "Marker AR experiences — heart and kidney apps for students.",
};

export default function ArLibraryPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <Navbar />
      <ArLibraryHub />
    </div>
  );
}
