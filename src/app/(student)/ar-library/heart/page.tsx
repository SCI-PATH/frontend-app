import { notFound } from "next/navigation";

import { Navbar } from "@/components/common/Navbar";
import { ArExperienceView } from "@/components/features/learning-path-engine/ar-library/ArExperienceView";
import { getArExperience } from "@/components/features/learning-path-engine/ar-library/catalog";

export const metadata = {
  title: "Human Heart AR | SCI-PATH",
  description: "Scan the heart marker and download the Heart AR Android app.",
};

export default function HeartArPage() {
  const experience = getArExperience("heart");
  if (!experience) notFound();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <Navbar />
      <ArExperienceView experience={experience} />
    </div>
  );
}
