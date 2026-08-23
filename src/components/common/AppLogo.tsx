import Image from "next/image";

import { APP_LOGO_PATH, APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  hero: 80,
} as const;

type AppLogoSize = keyof typeof SIZE_PX;

interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
  priority?: boolean;
}

export function AppLogo({ size = "md", className, priority }: AppLogoProps) {
  const px = SIZE_PX[size];

  return (
    <Image
      src={APP_LOGO_PATH}
      alt={`${APP_NAME} logo`}
      width={px}
      height={px}
      className={cn("shrink-0 object-contain", className)}
      priority={priority}
    />
  );
}
