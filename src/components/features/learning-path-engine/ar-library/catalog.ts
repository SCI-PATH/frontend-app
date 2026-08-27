/**
 * Student AR library catalog.
 * Markers stay in frontend `public/ar-library/...`.
 * APKs are hosted on S3 (too large for git): sci-path-demo-assets-dhanushi.
 */

const S3_AR_BASE =
  "https://sci-path-demo-assets-dhanushi.s3.ap-south-1.amazonaws.com/ar-models/ar-library";

export type ArExperience = {
  id: "heart" | "kidney";
  title: string;
  shortTitle: string;
  description: string;
  href: string;
  /** Local marker image under /public */
  markerSrc: string;
  /** Shown until markerSrc loads */
  markerFallbackSrc: string;
  /** Public S3 HTTPS URL for the Android APK */
  apkSrc: string;
  apkDownloadName: string;
  accentClass: string;
};

export const AR_EXPERIENCES: ArExperience[] = [
  {
    id: "heart",
    title: "Human Heart AR",
    shortTitle: "Heart",
    description:
      "Scan the heart marker with the SCI PATH Heart app to explore the organ in AR.",
    href: "/ar-library/heart",
    markerSrc: "/ar-library/heart/marker.jpg",
    markerFallbackSrc: "/ar-library/heart/marker.svg",
    apkSrc: `${S3_AR_BASE}/heart/app.apk`,
    apkDownloadName: "SCI-PATH-Heart-AR.apk",
    accentClass: "border-brand-accent/25 bg-brand-accent/8 text-brand-accent",
  },
  {
    id: "kidney",
    title: "Human Kidney AR",
    shortTitle: "Kidney",
    description:
      "Scan the kidney marker with the SCI PATH Kidney app to explore the organ in AR.",
    href: "/ar-library/kidney",
    markerSrc: "/ar-library/kidney/marker.png",
    markerFallbackSrc: "/ar-library/kidney/marker.svg",
    apkSrc: `${S3_AR_BASE}/kidney/app.apk`,
    apkDownloadName: "SCI-PATH-Kidney-AR.apk",
    accentClass: "border-brand-primary/25 bg-brand-primary/8 text-brand-primary",
  },
];

export function getArExperience(id: string): ArExperience | undefined {
  return AR_EXPERIENCES.find((item) => item.id === id);
}
