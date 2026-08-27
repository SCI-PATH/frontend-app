/** Drop real assets here when ready:
 *  - marker.png (or .jpg) — printable / on-screen scan target
 *  - app.apk — Android install for this AR experience
 *
 * Expected public paths:
 *  /ar-library/heart/marker.png
 *  /ar-library/heart/app.apk
 *  /ar-library/kidney/marker.png
 *  /ar-library/kidney/app.apk
 */

export type ArExperience = {
  id: "heart" | "kidney";
  title: string;
  shortTitle: string;
  description: string;
  href: string;
  /** Preferred marker once you drop the real file */
  markerSrc: string;
  /** Shown until markerSrc loads (placeholder SVG) */
  markerFallbackSrc: string;
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
    apkSrc: "/ar-library/heart/app.apk",
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
    apkSrc: "/ar-library/kidney/app.apk",
    apkDownloadName: "SCI-PATH-Kidney-AR.apk",
    accentClass: "border-brand-primary/25 bg-brand-primary/8 text-brand-primary",
  },
];

export function getArExperience(id: string): ArExperience | undefined {
  return AR_EXPERIENCES.find((item) => item.id === id);
}
