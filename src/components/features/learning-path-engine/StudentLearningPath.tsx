"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStudentInitialCategory } from "@/lib/api/assessment";
import {
  buildGamingServiceLaunchUrl,
  getGamingServiceBaseUrl,
} from "@/components/features/gaming-service/buildGamingServiceLaunchUrl";
import { readGamingLaunchParams } from "@/components/features/gaming-service/getGamingLaunchContext";
import { useUserStore } from "@/store/useUserStore";
import type { CurriculumLesson, CurriculumResponse, LessonResponse } from "@/types";

import {
  getCurriculum,
  getHealth,
  getProgress,
  postAnalyticsProfile,
  postLesson,
  postProgress,
} from "./api/client.js";
import LessonStage from "./components/LessonStage.jsx";
import ScienceExplorer from "./components/ScienceExplorer.jsx";
import TestKnowledgeModal from "./components/TestKnowledgeModal.jsx";
import { isOfflineError, notifyUserFacingError, toUserFacingMessage } from "./errors.js";
import FeatureShell from "./FeatureShell";
import { useAppStore } from "./store/appStore.js";

const GRADE_OPTIONS = [6, 7, 8, 9];
const LESSON_EVENT = "lesson_start";

const PROFILE_LABEL: Record<string, string> = {
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
  weak: "Basic",
  average: "Intermediate",
  strong: "Advanced",
  smart: "Advanced",
};

/**
 * Aptitude (IAE Amplitude) is required before any lesson.
 * Always re-fetch on lesson start so post-game quiz level changes apply.
 * Never reuse a stale LPE cache alone — no aptitude ⇒ cannot start.
 */
async function resolveLearnerProfileForLesson(
  userId: string,
  grade: number
): Promise<{ profile: string | null; reason: "ok" | "no_aptitude" | "assessment_unreachable" }> {
  try {
    const fromIae = await getStudentInitialCategory(userId);
    if (!fromIae.category) {
      return { profile: null, reason: "no_aptitude" };
    }
    await postAnalyticsProfile({
      user_id: userId,
      profile: fromIae.category,
      source: "intelligent_assessment_engine",
      grade,
    });
    return { profile: fromIae.category, reason: "ok" };
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 404) {
      return { profile: null, reason: "no_aptitude" };
    }
    return { profile: null, reason: "assessment_unreachable" };
  }
}

const selectClassName =
  "h-8 w-full rounded-lg border border-brand-surface bg-white px-2.5 text-sm text-brand-text outline-none focus-visible:border-brand-primary focus-visible:ring-3 focus-visible:ring-brand-primary/30";

/**
 * Student learning-path UI only.
 * Mounted from `(student)` routes — no teacher toggle (README route-group rule).
 */
export default function StudentLearningPath() {
  const setStoreRole = useAppStore((s) => s.setRole);
  const setStoreUserId = useAppStore((s) => s.setUserId);
  const setStoreGrade = useAppStore((s) => s.setGrade);

  const sessionUserId = useUserStore((s) => s.userId);
  const sessionGrade = useUserStore((s) => s.grade);
  const sessionName = useUserStore((s) => s.fullName);

  const [userId, setUserId] = useState(sessionUserId || "");
  const [grade, setGrade] = useState(sessionGrade ?? 7);
  const [lessonId, setLessonId] = useState("");
  const [profile, setProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [result, setResult] = useState<LessonResponse | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumResponse | null>(null);
  const [view, setView] = useState<"setup" | "lesson" | "chapterChoice" | "explore">("setup");
  const [resumeStep, setResumeStep] = useState(0);
  const [loadingNextLesson, setLoadingNextLesson] = useState(false);
  const [pickedLessonId, setPickedLessonId] = useState("");
  const [choiceBusy, setChoiceBusy] = useState(false);
  const [choiceError, setChoiceError] = useState("");
  const [finishedLessonId, setFinishedLessonId] = useState("");
  const [testKnowledgeOpen, setTestKnowledgeOpen] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const lastSavedRef = useRef({ lessonId: "", step: -1 });
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    setStoreRole("student");
  }, [setStoreRole]);

  useEffect(() => {
    if (sessionUserId) setUserId(sessionUserId);
  }, [sessionUserId]);

  useEffect(() => {
    if (sessionGrade != null) setGrade(Number(sessionGrade));
  }, [sessionGrade]);

  useEffect(() => {
    setStoreUserId(userId);
  }, [userId, setStoreUserId]);

  useEffect(() => {
    setStoreGrade(grade);
  }, [grade, setStoreGrade]);

  const gradeLessons: CurriculumLesson[] = useMemo(
    () => curriculum?.lessons || [],
    [curriculum],
  );

  const completedSet = useMemo(
    () => new Set(completedLessonIds || []),
    [completedLessonIds],
  );

  const completedInGrade = useMemo(() => {
    if (!gradeLessons.length) return 0;
    return gradeLessons.filter((l) => completedSet.has(l.lesson_id)).length;
  }, [gradeLessons, completedSet]);

  function chapterOptionLabel(l: CurriculumLesson, index?: number) {
    const title = l.display_title || l.title || l.lesson_id;
    const n = typeof index === "number" ? `${index + 1}. ` : "";
    if (completedSet.has(l.lesson_id)) return `${n}✓ ${title}`;
    return `${n}${title}`;
  }

  const currentLessonMeta = useMemo(() => {
    if (!lessonId || !gradeLessons.length) return null;
    return gradeLessons.find((l) => l.lesson_id === lessonId) || null;
  }, [gradeLessons, lessonId]);

  const lessonTitle = useMemo(() => {
    if (!currentLessonMeta) return "";
    return currentLessonMeta.display_title || currentLessonMeta.title || "";
  }, [currentLessonMeta]);

  const lessonIndex = useMemo(() => {
    if (!lessonId || !gradeLessons.length) return -1;
    return gradeLessons.findIndex((l) => l.lesson_id === lessonId);
  }, [gradeLessons, lessonId]);

  const isFinalLesson = useMemo(() => {
    if (!gradeLessons.length || lessonIndex < 0) return false;
    return lessonIndex >= gradeLessons.length - 1;
  }, [gradeLessons, lessonIndex]);

  const nextLessonAfterFinished = useMemo(() => {
    if (!finishedLessonId || !gradeLessons.length) return null;
    const idx = gradeLessons.findIndex((l) => l.lesson_id === finishedLessonId);
    if (idx < 0) return null;
    return gradeLessons[idx + 1] || null;
  }, [finishedLessonId, gradeLessons]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    Promise.all([getCurriculum(grade), getProgress(userId)])
      .then(async ([c, p]) => {
        if (cancelled) return;
        setBackendOnline(true);
        setCurriculum(c);
        const done = Array.isArray(p?.completed_lesson_ids) ? p.completed_lesson_ids : [];
        setCompletedLessonIds(done);
        const lessons = c?.lessons || [];
        const locked = viewRef.current === "chapterChoice" || viewRef.current === "lesson";
        // Display-only refresh; lesson start always re-fetches (may change after gaming quiz).
        const resolved = await resolveLearnerProfileForLesson(userId, grade);
        if (cancelled) return;
        if (locked) {
          if (resolved.profile) setProfile(resolved.profile);
          return;
        }
        const restored = p?.current_lesson_id;
        const restoredOk =
          restored &&
          lessons.some((l: CurriculumLesson) => l.lesson_id === restored) &&
          Number(p?.grade) === Number(grade);
        if (restoredOk) setLessonId(restored);
        else if (lessons.length) setLessonId(lessons[0].lesson_id);
        else setLessonId("");
        if (resolved.profile) setProfile(resolved.profile);
        else setProfile(null);
        setResumeStep(0);
      })
      .catch((err) => {
        if (cancelled) return;
        const offline = isOfflineError(err);
        setBackendOnline(!offline);
        notifyUserFacingError(err, "bootstrap-load", { userId, offline });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, grade]);

  function resetSessionStepForLesson(id: string) {
    setResumeStep(0);
    lastSavedRef.current = { lessonId: "", step: -1 };
    if (id) {
      void postProgress({
        user_id: userId,
        action: "save_state",
        lesson_id: id,
        step_index: 0,
        grade,
      }).catch(() => {});
    }
  }

  async function onGradeChange(nextGrade: string | number) {
    const g = Number(nextGrade);
    setGrade(g);
    setResult(null);
    setView("setup");
    setChoiceError("");
    setFinishedLessonId("");
    setResumeStep(0);
    lastSavedRef.current = { lessonId: "", step: -1 };
    try {
      const p = await postProgress({
        user_id: userId,
        action: "set_grade",
        lesson_id: "",
        grade: g,
      });
      if (p?.current_lesson_id) setLessonId(p.current_lesson_id);
    } catch {
      /* curriculum reload effect will still set first lesson */
    }
  }

  async function startLessonFor(targetLessonId: string) {
    const lid = (targetLessonId || "").trim();
    if (!lid) return { ok: false as const, error: "Pick a chapter first." };

    let learnerProgress;
    try {
      learnerProgress = await getProgress(userId);
    } catch (err) {
      const offline = isOfflineError(err);
      if (offline) setBackendOnline(false);
      const msg = toUserFacingMessage(err);
      setChoiceError(msg);
      return { ok: false as const, error: msg };
    }
    void learnerProgress;

    // Fresh pull every lesson (aptitude gate + post-game level updates).
    const resolved = await resolveLearnerProfileForLesson(userId, grade);
    if (!resolved.profile) {
      const msg =
        resolved.reason === "assessment_unreachable"
          ? "Could not reach the aptitude service. Check that the assessment engine is running, then try again."
          : "Complete the aptitude test first. Your result unlocks lessons at the right learning level.";
      setChoiceError(msg);
      setProfile(null);
      return { ok: false as const, error: msg };
    }
    setProfile(resolved.profile);

    setResult(null);
    setResumeStep(0);
    lastSavedRef.current = { lessonId: "", step: -1 };
    setChoiceError("");

    try {
      await getHealth();
      setBackendOnline(true);
      await postProgress({
        user_id: userId,
        action: "set_current",
        lesson_id: lid,
        grade,
      }).catch(() => {});

      const data = await postLesson({
        user_id: userId,
        profile: resolved.profile,
        event: LESSON_EVENT,
        lesson_id: lid,
        use_stored_mastery: true,
      });

      if (data?.status === "unavailable" || !(data?.lesson_text || "").trim()) {
        const raw =
          data?.message ||
          "This chapter is not ready yet. Ask your teacher to generate and save it, or pick another chapter.";
        const msg = toUserFacingMessage(raw, {
          fallback:
            "This chapter is not ready yet. Ask your teacher to generate and save it, or pick another chapter.",
        });
        setChoiceError(msg);
        return { ok: false as const, error: msg, data };
      }

      if (data?.profile) setProfile(data.profile);
      setLessonId(lid);
      setResumeStep(0);
      setResult(data);
      setView("lesson");
      setChoiceError("");
      return { ok: true as const, data };
    } catch (err) {
      const offline = isOfflineError(err);
      if (offline) setBackendOnline(false);
      const msg = toUserFacingMessage(err);
      setChoiceError(msg);
      notifyUserFacingError(err, "lesson-start", { userId, offline });
      return { ok: false as const, error: msg };
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await startLessonFor(lessonId);
    } finally {
      setLoading(false);
    }
  }

  function exitLesson() {
    if (lessonId) resetSessionStepForLesson(lessonId);
    else setResumeStep(0);
    setView("setup");
    setResult(null);
    setChoiceError("");
  }

  function goHomeSetup() {
    setView("setup");
    setResumeStep(0);
    setResult(null);
    setChoiceError("");
    setFinishedLessonId("");
    lastSavedRef.current = { lessonId: "", step: -1 };
  }

  async function openChapterChoice(finishedId: string) {
    setFinishedLessonId(finishedId || "");
    const idx = gradeLessons.findIndex((l) => l.lesson_id === finishedId);
    const next = idx >= 0 ? gradeLessons[idx + 1] : null;
    setPickedLessonId(next?.lesson_id || "");
    setResult(null);
    setView("chapterChoice");
    setChoiceError("");
    lastSavedRef.current = { lessonId: "", step: -1 };
  }

  async function loadChosenChapter(targetLessonId: string) {
    const lid = (targetLessonId || pickedLessonId || "").trim();
    if (!lid) {
      setChoiceError("Choose a chapter from the list first.");
      return;
    }
    setChoiceBusy(true);
    setLoadingNextLesson(true);
    setChoiceError("");
    try {
      const { ok } = await startLessonFor(lid);
      if (!ok) setView("chapterChoice");
    } finally {
      setChoiceBusy(false);
      setLoadingNextLesson(false);
    }
  }

  async function onLessonDone() {
    const finishedId = result?.lesson_id || lessonId;
    if (finishedId) {
      setFinishedLessonId(finishedId);
      // Optimistic — home grid + chapter picker show green ✓ immediately on Done.
      setCompletedLessonIds((prev) =>
        prev.includes(finishedId) ? prev : [...prev, finishedId],
      );
    }
    setTestKnowledgeOpen(true);

    if (!finishedId) return;

    try {
      const p = await postProgress({
        user_id: userId,
        action: "mark_complete",
        lesson_id: finishedId,
        grade,
      });
      if (Array.isArray(p?.completed_lesson_ids)) {
        setCompletedLessonIds(p.completed_lesson_ids);
      }
    } catch {
      /* Keep optimistic completedLessonIds — popup + highlight already shown */
    }
  }

  /** After a lesson, OK opens the Discovery Grove start screen (Vite farm). */
  function onTestKnowledgeOk() {
    setTestKnowledgeOpen(false);
    const params = readGamingLaunchParams();
    if (params) {
      window.location.assign(buildGamingServiceLaunchUrl(params));
      return;
    }
    window.location.assign(getGamingServiceBaseUrl());
  }

  const onStepChange = useCallback(
    (stepIndex: number) => {
      if (!lessonId) return;
      if (
        lastSavedRef.current.lessonId === lessonId &&
        lastSavedRef.current.step === stepIndex
      ) {
        return;
      }
      lastSavedRef.current = { lessonId, step: stepIndex };
      setResumeStep(stepIndex);
      void postProgress({
        user_id: userId,
        action: "save_state",
        lesson_id: lessonId,
        step_index: stepIndex,
        grade,
      }).catch(() => {});
    },
    [lessonId, userId, grade],
  );

  if (view === "explore") {
    return (
      <FeatureShell>
        <main className="explore-main">
          <ScienceExplorer
            initialWorldId={null}
            lessonHint=""
            onClose={() => setView("setup")}
            title="SCI-PATH science map"
          />
        </main>
      </FeatureShell>
    );
  }

  if (view === "chapterChoice") {
    const nextMeta = nextLessonAfterFinished;
    const nextTitle = nextMeta ? nextMeta.display_title || nextMeta.title : null;
    const finishedMeta = gradeLessons.find((l) => l.lesson_id === finishedLessonId);
    const finishedTitle =
      finishedMeta?.display_title || finishedMeta?.title || "this chapter";

    return (
      <FeatureShell>
        <main className="mx-auto max-w-xl px-4 py-8">
          <h1 className="mb-4 text-2xl font-semibold text-brand-text">SCI-PATH</h1>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Chapter complete</CardTitle>
              <CardDescription>
                You finished <strong>{finishedTitle}</strong> (Grade {grade}). Continue in order, or
                pick any chapter. Level:{" "}
                <strong>{PROFILE_LABEL[profile || ""] || profile}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {nextMeta?.lesson_id ? (
                <Button
                  disabled={choiceBusy}
                  className="bg-brand-primary text-white hover:bg-brand-primary/90"
                  onClick={() => void loadChosenChapter(nextMeta.lesson_id)}
                >
                  {choiceBusy ? "Loading…" : `Continue to next: ${nextTitle}`}
                </Button>
              ) : (
                <p className="text-sm text-brand-text/70">
                  That was the last chapter in this grade — pick any chapter to review, or go home.
                </p>
              )}

              <label htmlFor="pickChapter" className="text-sm font-medium text-brand-text">
                Or pick any chapter
              </label>
              <p className="text-xs text-brand-text/70">
                ✓ = finished ({completedInGrade} of {gradeLessons.length}). You can still relearn.
              </p>
              <select
                id="pickChapter"
                className={selectClassName}
                value={pickedLessonId}
                onChange={(e) => {
                  setPickedLessonId(e.target.value);
                  setChoiceError("");
                }}
                disabled={choiceBusy}
              >
                <option value="">Choose a chapter…</option>
                {gradeLessons.map((l, i) => (
                  <option key={l.lesson_id} value={l.lesson_id}>
                    {chapterOptionLabel(l, i)}
                    {l.lesson_id === finishedLessonId ? " · just finished" : ""}
                  </option>
                ))}
              </select>

              {choiceError ? (
                <p className="text-sm text-brand-accent">{choiceError}</p>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  disabled={choiceBusy || !pickedLessonId}
                  className="bg-brand-primary text-white hover:bg-brand-primary/90"
                  onClick={() => void loadChosenChapter(pickedLessonId)}
                >
                  {choiceBusy ? "Loading…" : "Start selected chapter"}
                </Button>
                <Button variant="outline" disabled={choiceBusy} onClick={goHomeSetup}>
                  Back to home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </FeatureShell>
    );
  }

  if (view === "lesson" && result?.lesson_text) {
    const displayProfile = result.profile || profile;
    const displayPresentation = result.presentation_mode || undefined;
    const stageKey = [
      result.lesson_id || lessonId,
      displayProfile,
      displayPresentation || "",
      (result.lesson_text || "").length,
    ].join(":");
    return (
      <FeatureShell>
        <LessonStage
          key={stageKey}
          lessonText={result.lesson_text}
          lessonId={result.lesson_id || lessonId}
          lessonTitle={lessonTitle}
          event={LESSON_EVENT}
          profile={displayProfile || undefined}
          presentationMode={displayPresentation}
          isFinalLesson={isFinalLesson}
          initialStep={resumeStep}
          loadingNextLesson={loadingNextLesson}
          onStepChange={onStepChange}
          onClose={exitLesson}
          onLessonDone={onLessonDone}
        />
        <TestKnowledgeModal
          open={testKnowledgeOpen}
          lessonTitle={lessonTitle}
          onOk={onTestKnowledgeOk}
        />
      </FeatureShell>
    );
  }

  const learnerName = sessionName || "Science explorer";
  const initials = learnerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const learningLevel = PROFILE_LABEL[profile || ""] || "Aptitude test pending";
  const totalLessons = gradeLessons.length;
  const pendingInGrade = Math.max(0, totalLessons - completedInGrade);
  const progressPercent = totalLessons
    ? Math.round((completedInGrade / totalLessons) * 100)
    : 0;
  const selectedLesson = gradeLessons.find((lesson) => lesson.lesson_id === lessonId);

  return (
    <FeatureShell>
      <div className="bg-brand-primary px-5 pt-5 pb-28 sm:px-8 lg:px-12 xl:px-16">
        <header className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-brand-primary"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => setView("explore")}
            className="m-0 inline-flex w-auto items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-special transition-colors hover:bg-brand-special hover:text-white"
          >
            <Compass className="size-4" aria-hidden />
            Science map
          </button>
        </header>
      </div>

      <main className="mx-auto -mt-20 w-full max-w-[1440px] px-5 pb-10 sm:px-8 lg:px-12 xl:px-16">
        <section className="mb-8 rounded-2xl border border-brand-surface bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-xl font-bold text-white sm:size-20 sm:text-2xl">
                {initials || "SP"}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-brand-text sm:text-3xl">
                  {learnerName}
                </h1>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                    <GraduationCap className="size-3.5" aria-hidden />
                    Grade {grade}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-text/70">
                    {learningLevel}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 lg:w-auto lg:min-w-[26rem]">
              <div className="rounded-xl bg-brand-secondary/15 px-3 py-3 text-center">
                <p className="text-2xl font-bold text-brand-text sm:text-3xl">{completedInGrade}</p>
                <p className="text-xs font-medium text-brand-text/60">Completed</p>
              </div>
              <div className="rounded-xl bg-brand-accent/15 px-3 py-3 text-center">
                <p className="text-2xl font-bold text-brand-text sm:text-3xl">{pendingInGrade}</p>
                <p className="text-xs font-medium text-brand-text/60">Pending</p>
              </div>
              <div className="rounded-xl bg-brand-primary/15 px-3 py-3 text-center">
                <p className="text-2xl font-bold text-brand-text sm:text-3xl">{progressPercent}%</p>
                <p className="text-xs font-medium text-brand-text/60">Progress</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-brand-text/60">
              <span>Grade {grade} progress</span>
              <span>
                {completedInGrade} of {totalLessons} chapters
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-brand-surface">
              <div
                className="h-full rounded-full bg-brand-secondary transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </section>

        <form onSubmit={onSubmit}>
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-bold text-brand-text sm:text-xl">Choose a chapter</h2>
              <p className="mt-1 text-sm text-brand-text/60">
                Completed chapters stay open so you can revise any time.
              </p>
            </div>
            {sessionGrade == null ? (
              <div className="flex flex-wrap gap-1 rounded-xl border border-brand-surface bg-white p-1">
                {GRADE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => void onGradeChange(String(option))}
                    className={`m-0 w-auto rounded-lg border-0 px-3 py-1.5 text-xs font-semibold transition-colors ${
                      grade === option
                        ? "bg-brand-primary text-white"
                        : "bg-white text-brand-text/60 hover:text-brand-text"
                    }`}
                  >
                    Grade {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-medium text-brand-text/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-brand-secondary" aria-hidden />
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-brand-surface" aria-hidden />
              Not started
            </span>
          </div>

          {gradeLessons.length ? (
            <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {gradeLessons.map((lesson, index) => {
                const complete = completedSet.has(lesson.lesson_id);
                const selected = lesson.lesson_id === lessonId;
                const title = lesson.display_title || lesson.title || lesson.lesson_id;
                return (
                  <li key={lesson.lesson_id}>
                    <button
                      type="button"
                      onClick={() => setLessonId(lesson.lesson_id)}
                      aria-pressed={selected}
                      className={`m-0 flex h-full w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
                        selected
                          ? "border-brand-primary bg-brand-primary/5"
                          : complete
                            ? "border-brand-secondary/40 bg-brand-secondary/5 hover:border-brand-secondary"
                            : "border-brand-surface bg-white hover:border-brand-primary"
                      }`}
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          complete
                            ? "bg-brand-secondary text-brand-text"
                            : selected
                              ? "bg-brand-primary text-white"
                              : "bg-brand-surface text-brand-text/70"
                        }`}
                      >
                        {complete ? <Check className="size-5" aria-hidden /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-brand-text">{title}</span>
                        <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-text/55">
                          <BookOpen className="size-3.5" aria-hidden />
                          {complete ? "Completed — revise" : "Not started"}
                        </span>
                      </span>
                      {selected ? (
                        <ChevronRight className="mt-1 size-4 shrink-0 text-brand-primary" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-brand-surface bg-white p-8 text-center text-sm text-brand-text/60">
              {backendOnline
                ? `Loading your Grade ${grade} chapters…`
                : "Chapters unavailable while the learning service is offline."}
            </div>
          )}

          {choiceError ? (
            <p className="mt-4 rounded-xl bg-brand-accent/10 px-3 py-2 text-sm font-medium text-brand-accent">
              {choiceError}
            </p>
          ) : null}

          {!backendOnline ? (
            <p className="mt-4 rounded-xl bg-brand-accent/10 px-3 py-2 text-sm font-medium text-brand-accent">
              Cannot reach the learning service. Make sure it is running, then try again.
            </p>
          ) : null}

          <div className="sticky bottom-4 z-10 mt-6 flex flex-col items-stretch gap-4 rounded-2xl border border-brand-surface bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wide text-brand-text/50 uppercase">
                Selected chapter
              </p>
              <p className="mt-0.5 truncate text-base font-semibold text-brand-text">
                {selectedLesson
                  ? selectedLesson.display_title || selectedLesson.title || selectedLesson.lesson_id
                  : "Choose a chapter above"}
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading || !lessonId || !backendOnline || !userId}
              className="m-0 h-12 w-full shrink-0 border-0 bg-brand-primary px-8 text-base text-white hover:bg-brand-primary/90 sm:w-auto"
            >
              {loading ? "Preparing lesson…" : "Start lesson"}
            </Button>
          </div>
        </form>
      </main>
    </FeatureShell>
  );
}
