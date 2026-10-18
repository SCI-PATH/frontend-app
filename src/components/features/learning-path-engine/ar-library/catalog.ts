/**
 * Student AR library catalog.
 * Markers stay in frontend `public/ar-library/...`.
 * APKs are hosted on S3 (too large for git): sci-path-demo-assets-dhanu.
 */

const S3_AR_BASE =
  "https://sci-path-demo-assets-dhanu.s3.ap-southeast-2.amazonaws.com/ar-models/ar-library";

export type ArExperienceId =
  | "heart"
  | "kidney"
  | "circuit"
  | "atom"
  | "magnet"
  | "water";

export type ArExperience = {
  id: ArExperienceId;
  title: string;
  shortTitle: string;
  description: string;
  href: string;
  /** Local marker image under /public — drop marker.jpg or marker.png here later */
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
  {
    id: "circuit",
    title: "Electric Circuit AR",
    shortTitle: "Circuit",
    description:
      "Scan the circuit marker to explore a simple battery–bulb circuit in AR.",
    href: "/ar-library/circuit",
    markerSrc: "/ar-library/circuit/marker.png",
    markerFallbackSrc: "/ar-library/circuit/marker.svg",
    apkSrc: `${S3_AR_BASE}/circuit/app.apk`,
    apkDownloadName: "SCI-PATH-Circuit-AR.apk",
    accentClass: "border-brand-primary/25 bg-brand-primary/8 text-brand-primary",
  },
  {
    id: "atom",
    title: "Atom Structure AR",
    shortTitle: "Atom",
    description:
      "Scan the atom marker to explore nucleus and electron shells in AR.",
    href: "/ar-library/atom",
    markerSrc: "/ar-library/atom/marker.png",
    markerFallbackSrc: "/ar-library/atom/marker.svg",
    apkSrc: `${S3_AR_BASE}/atom/app.apk`,
    apkDownloadName: "SCI-PATH-Atom-AR.apk",
    accentClass: "border-brand-special/25 bg-brand-special/8 text-brand-special",
  },
  {
    id: "magnet",
    title: "Bar Magnet AR",
    shortTitle: "Magnet",
    description:
      "Scan the magnet marker to explore north–south poles and field lines in AR.",
    href: "/ar-library/magnet",
    markerSrc: "/ar-library/magnet/marker.png",
    markerFallbackSrc: "/ar-library/magnet/marker.svg",
    apkSrc: `${S3_AR_BASE}/magnet/app.apk`,
    apkDownloadName: "SCI-PATH-Magnet-AR.apk",
    accentClass: "border-brand-accent/25 bg-brand-accent/8 text-brand-accent",
  },
  {
    id: "water",
    title: "Water Molecule AR",
    shortTitle: "Water",
    description:
      "Scan the water marker to explore the H₂O molecule shape in AR.",
    href: "/ar-library/water",
    markerSrc: "/ar-library/water/marker.png",
    markerFallbackSrc: "/ar-library/water/marker.svg",
    apkSrc: `${S3_AR_BASE}/water/app.apk`,
    apkDownloadName: "SCI-PATH-Water-AR.apk",
    accentClass: "border-brand-primary/25 bg-brand-primary/8 text-brand-primary",
  },
];

export function getArExperience(id: string): ArExperience | undefined {
  return AR_EXPERIENCES.find((item) => item.id === id);
}
