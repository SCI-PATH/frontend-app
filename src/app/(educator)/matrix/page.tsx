import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function MatrixPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
        SCI-PATH
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-text">
        Educator matrix
      </h1>
      <p className="mt-2 text-sm text-brand-text/70">
        Classroom overview landing. Assessment tools will compose here from{" "}
        <code className="text-brand-primary">features/assessment-engine</code>.
      </p>
      <Button
        asChild
        className="mt-6 w-fit bg-brand-primary text-white hover:bg-brand-primary/90"
      >
        <Link href="/content-generation">
          Open content generation
          <BookOpenText className="size-4" aria-hidden />
        </Link>
      </Button>
    </main>
  );
}
