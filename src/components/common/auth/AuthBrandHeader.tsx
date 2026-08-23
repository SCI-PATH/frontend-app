import { AppLogo } from "@/components/common/AppLogo";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

/** Centered brand header for login / register screens. */
export function AuthBrandHeader() {
  const [nameFirst, nameSecond] = APP_NAME.split(" ");

  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-2xl bg-white p-2 shadow-md shadow-brand-primary/15 ring-1 ring-brand-surface">
        <AppLogo size="hero" className="size-20 sm:size-24" priority />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-brand-primary">{nameFirst}</span>{" "}
          <span className="text-brand-text">{nameSecond}</span>
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-brand-text/65 sm:max-w-sm sm:text-base">
          {APP_TAGLINE}
        </p>
      </div>

      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="size-2 rounded-full bg-brand-primary" />
        <span className="size-2 rounded-full bg-brand-secondary" />
        <span className="size-2 rounded-full bg-brand-accent" />
        <span className="size-2 rounded-full bg-brand-special" />
      </div>
    </header>
  );
}
