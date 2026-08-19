import { cn } from "@/lib/utils";

/** Full-width SCI-PATH brand spectrum bar (matches auth card header). */
export function BrandGradientBar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-1.5 w-full bg-[linear-gradient(90deg,#00A8E8_0%,#70E000_35%,#FF6B35_70%,#7209B7_100%)]",
        className
      )}
    />
  );
}
