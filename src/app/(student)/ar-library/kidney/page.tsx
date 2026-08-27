import { notFound } from "next/navigation";

import { Navbar } from "@/components/common/Navbar";
import { ArExperienceView } from "@/components/features/learning-path-engine/ar-library/ArExperienceView";
import { getArExperience } from "@/components/features/learning-path-engine/ar-library/catalog";

export const metadata = {
  title: "Human Kidney AR | SCI-PATH",
  description: "Scan the kidney marker and download the Kidney AR Android app.",
};

export default function KidneyArPage() {
  const experience = getArExperience("kidney");
  if (!experience) notFound();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <Navbar />
      <ArExperienceView experience={experience} />
    </div>
  );
}
