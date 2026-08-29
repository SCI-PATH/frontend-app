"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  GraduationCap,
  History,
  Loader2,
  OctagonX,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/types";
import { terminateQuizSession } from "../api/quizzes";
import { getAssessmentApiBase } from "../api/client";
import { useAssessmentUser } from "../store/useAssessmentUser";
import { useQuizSessionStore } from "../store/useQuizSessionStore";
import { AssessmentApiError } from "../types";

const NAV_CARDS = [
  {
    href: "/assessment/amplitude",
    title: "Aptitude Test",
    description: "Survey → 10-item quiz → initial category",
    icon: Sparkles,
    roles: ["student"] as const satisfies readonly UserRole[],
    accent: "bg-brand-special/10 text-brand-special",
    studentOnly: true,
  },
  {
    href: "/assessment/custom-quiz",
    title: "Custom Quiz",
    description: "Pick chapters & question count, then adapt",
    icon: BookOpenCheck,
    roles: ["student"] as const satisfies readonly UserRole[],
    accent: "bg-brand-primary/10 text-brand-primary",
    studentOnly: true,
  },
  {
    href: "/assessment/post-lesson?chapter_id=G6_C8&grade=6",
    title: "Post-Lesson Quiz",
    description: "Starts immediately (simulates lesson handoff)",
    icon: Wand2,
    roles: ["student"] as const satisfies readonly UserRole[],
    accent: "bg-brand-secondary/15 text-brand-text",
    studentOnly: true,
  },
  {
    href: "/assessment/history",
    title: "Student History",
    description: "Past sessions, answers & AI explanations",
    icon: History,
    roles: ["student"] as const satisfies readonly UserRole[],
    accent: "bg-brand-accent/10 text-brand-accent",
    studentOnly: true,
  },
  {
    href: "/assessment/question-bank",
    title: "Question Bank",
    description: "C2 pending questions · approve / reject",
    icon: GraduationCap,
    roles: ["educator"] as const satisfies readonly UserRole[],
    accent: "bg-brand-special/10 text-brand-special",
    educatorOnly: true,
  },
] as const;

export function DevHubScreen() {
  const active = useAssessmentUser();
  const lastSessionId = useQuizSessionStore((s) => s.lastSessionId);
  const [sessionId, setSessionId] = useState("");
  const [terminating, setTerminating] = useState(false);
  const [termMsg, setTermMsg] = useState<string | null>(null);
  const [termError, setTermError] = useState<string | null>(null);

  const effectiveSession = sessionId.trim() || lastSessionId || "";

  async function handleTerminate() {
    if (!effectiveSession) {
      setTermError("Enter a session_id (or start a quiz first).");
      return;
    }
    setTerminating(true);
    setTermError(null);
    setTermMsg(null);
    try {
      // TODO: INTEGRATION - Component 3 should call terminate when frustration
      // threshold is hit; this Dev Hub control is for local testing only.
      await terminateQuizSession(effectiveSession, {
        reason: "frustration_threshold",
        source: "component_3",
      });
      setTermMsg(`Terminated session ${effectiveSession}`);
    } catch (err) {
      setTermError(
        err instanceof AssessmentApiError ? err.message : "Terminate failed"
      );
    } finally {
      setTerminating(false);
    }
  }

  return (
    <div className="relative min-h-full flex-1 overflow-hidden bg-brand-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E826,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#70E00022,_transparent_40%),radial-gradient(ellipse_at_top_right,_#FF6B351A,_transparent_35%),radial-gradient(ellipse_at_bottom_left,_#7209B714,_transparent_40%)]"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="mb-2 bg-brand-accent/15 text-brand-accent hover:bg-brand-accent/15">
              Temporary · Component 2
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-brand-text sm:text-4xl">
              Assessment Engine Dev Hub
            </h1>
            <p className="mt-2 max-w-xl text-sm text-brand-text/65">
              Navigate assessment routes using your logged-in session. API:{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 text-brand-primary">
                {getAssessmentApiBase()}
              </code>
            </p>
          </div>
        </div>

        <Card className="mb-6 border-brand-surface bg-white/95">
          <CardContent className="flex flex-wrap items-center gap-3 py-4 text-sm text-brand-text/80">
            <span>
              <strong className="text-brand-text">ID:</strong>{" "}
              {active.userId || "—"}
            </span>
            <span>
              <strong className="text-brand-text">Role:</strong> {active.role}
            </span>
            {active.grade != null ? (
              <span>
                <strong className="text-brand-text">Grade:</strong>{" "}
                {active.grade}
              </span>
            ) : null}
            {active.classCode ? (
              <span>
                <strong className="text-brand-text">Class:</strong>{" "}
                {active.classCode}
              </span>
            ) : active.role === "student" ? (
              <Badge variant="outline">No class</Badge>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_CARDS.map((card) => {
            const locked =
              ("studentOnly" in card &&
                card.studentOnly &&
                active.role !== "student") ||
              ("educatorOnly" in card &&
                card.educatorOnly &&
                active.role !== "educator");
            const Icon = card.icon;
            return (
              <Card
                key={card.href}
                className="border-brand-surface bg-white/95 transition-shadow hover:shadow-[0_18px_50px_-28px_rgba(0,168,232,0.45)]"
              >
                <CardHeader>
                  <div
                    className={`mb-1 flex size-11 items-center justify-center rounded-2xl ${card.accent}`}
                  >
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="text-lg text-brand-text">
                    {card.title}
                  </CardTitle>
                  <CardDescription className="text-brand-text/60">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {locked ? (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full border-brand-surface"
                    >
                      {"studentOnly" in card && card.studentOnly
                        ? "Student account required"
                        : "Educator account required"}
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                    >
                      <Link href={card.href}>Open</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 border-brand-accent/30 bg-white/95">
          <CardHeader>
            <div className="flex items-center gap-2">
              <OctagonX className="size-5 text-brand-accent" aria-hidden />
              <CardTitle className="text-brand-text">Kill switch</CardTitle>
            </div>
            <CardDescription className="text-brand-text/60">
              Terminate an active quiz session (Component 3 simulation).
              {lastSessionId
                ? ` Last session: ${lastSessionId}`
                : " No session recorded yet."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-brand-text">
                session_id
              </label>
              <Input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder={lastSessionId ?? "uuid from last quiz"}
                className="h-10 border-brand-surface bg-brand-background/70"
              />
            </div>
            <Button
              disabled={terminating}
              onClick={() => void handleTerminate()}
              className="h-10 bg-brand-accent text-white hover:bg-brand-accent/90"
            >
              {terminating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Terminating…
                </>
              ) : (
                "Terminate session"
              )}
            </Button>
          </CardContent>
          {(termMsg || termError) && (
            <CardContent className="pt-0">
              {termMsg ? (
                <p className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-2 text-sm text-brand-text">
                  {termMsg}
                </p>
              ) : null}
              {termError ? (
                <p className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
                  {termError}
                </p>
              ) : null}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
