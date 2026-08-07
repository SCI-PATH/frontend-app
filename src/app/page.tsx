// TESTING PURPOSES ONLY: Placeholder landing page verifying the tech stack. Actual home layout will be implemented in Phase 2.
"use client";

import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-brand-background px-6 py-16 sm:px-10">
      <Card className="w-full max-w-lg border-brand-surface bg-white shadow-none">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <FlaskConical className="size-7" aria-hidden="true" />
          </div>
          <Badge className="bg-brand-secondary/15 text-brand-text hover:bg-brand-secondary/15">
            Stack verified
          </Badge>
          <CardTitle className="text-3xl font-semibold tracking-tight text-brand-text sm:text-4xl">
            SCI-PATH
          </CardTitle>
          <CardDescription className="max-w-md text-base text-brand-text/70">
            System for Science Pathways — Next.js, Tailwind brand tokens,
            lucide-react, and shadcn/ui are compiling cleanly for the team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <p className="text-sm text-brand-text/60">
            Grades 6–9 · Adaptive science learning research platform
          </p>
        </CardContent>
        <CardFooter className="justify-center gap-3 border-brand-surface">
          <Button className="bg-brand-primary text-white hover:bg-brand-primary/90">
            Enter workspace
          </Button>
          <Button
            variant="outline"
            className="border-brand-surface bg-white text-brand-text hover:bg-brand-surface"
          >
            Read developer guide
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
