"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Gamepad2,
  GraduationCap,
  Lock,
  ScanLine,
  Sparkles,
} from "lucide-react";

import { Navbar } from "@/components/common/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SocratesChatToggle } from "@/components/common/student-home/SocratesChatToggle";
import { resolveLearnerProfileForLesson } from "@/lib/api/learner-mastery";
import { STUDENT_AR_LIBRARY_PATH, STUDENT_HOME_PATH } from "@/lib/auth-routes";
import {
  buildGamingServiceLaunchUrl,
  getGamingServiceBaseUrl,
} from "@/components/features/gaming-service/buildGamingServiceLaunchUrl";
import { readGamingLaunchParams, buildChapterGameLaunchParams } from "@/components/features/gaming-service/getGamingLaunchContext";
import {
  chapterRewardItemId,
  chapterRewardLabel,
  farmLevelFromLessonId,
  findPendingChapterGame,
  isChapterUnlockedForLearning,
  lessonTitleOf,
  parseGameReturnSearch,
  stripGameReturnParams,
  type GameReturnPayload,
  type QuizByLesson,
} from "@/components/features/gaming-service/chapterGameProgress";
import { useUserStore } from "@/store/useUserStore";
import type { CurriculumLesson, CurriculumResponse, LessonResponse } from "@/types";

import {
  getCurriculum,
  getHealth,
  getProgress,
  postLesson,
  postProgress,
} from "./api/client.js";
import LessonStage from "./components/LessonStage.jsx";
import ScienceExplorer from "./components/ScienceExplorer.jsx";
import TestKnowledgeModal from "./components/TestKnowledgeModal.jsx";
import { isOfflineError, notifyUserFacingError, toUserFacingMessage, alertTeacherLessonNotPublished, isTeacherLessonUnavailable, TEACHER_LESSON_NOT_PUBLISHED_MSG } from "./errors.js";
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
  const [quizByLesson, setQuizByLesson] = useState<QuizByLesson>({});
  const [gameReturn, setGameReturn] = useState<GameReturnPayload | null>(null);
  const gameReturnHandledRef = useRef(false);
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

  const pendingChapterGame = useMemo(
    () => findPendingChapterGame(gradeLessons, completedLessonIds, quizByLesson),
    [gradeLessons, completedLessonIds, quizByLesson],
  );

  function isLessonUnlocked(index: number) {
    return isChapterUnlockedForLearning(
      index,
      gradeLessons,
      quizByLesson,
      completedLessonIds,
    );
  }

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
        setQuizByLesson(
          p?.quiz_by_lesson && typeof p.quiz_by_lesson === "object"
            ? p.quiz_by_lesson
            : {},
        );
        const lessons = c?.lessons || [];
        const locked = viewRef.current === "chapterChoice" || viewRef.current === "lesson";
        // Display-only: first chapter → IAE; later → analytics when evidence exists.
        const resolved = await resolveLearnerProfileForLesson(userId, grade, {
          lessonId: p?.current_lesson_id || null,
          completedLessonIds: done,
          persist: false,
        });
        if (cancelled) return;
        if (locked) {
          if (resolved.profile) setProfile(resolved.profile);
          return;
        }

        const returned =
          typeof window !== "undefined" && !gameReturnHandledRef.current
            ? parseGameReturnSearch(window.location.search)
            : null;
        if (returned) {
          gameReturnHandledRef.current = true;
          setFinishedLessonId(returned.lessonId);
          setGameReturn(returned);
          setPickedLessonId(returned.nextLessonId || "");
          setView("chapterChoice");
          let nextProgress: Awaited<ReturnType<typeof postProgress>> | null = null;
          try {
            nextProgress = await postProgress({
              user_id: userId,
              action: "record_quiz",
              lesson_id: returned.lessonId,
              score: 1,
              grade,
            });
            if (cancelled) return;
            if (Array.isArray(nextProgress?.completed_lesson_ids)) {
              setCompletedLessonIds(nextProgress.completed_lesson_ids);
            }
            if (nextProgress?.quiz_by_lesson) {
              setQuizByLesson(nextProgress.quiz_by_lesson);
            }
            if (nextProgress?.current_lesson_id) {
              setLessonId(nextProgress.current_lesson_id);
              setPickedLessonId(nextProgress.current_lesson_id);
            }
          } catch {
            /* keep URL payload — student can still continue */
          }
          if (typeof window !== "undefined" && window.history?.replaceState) {
            try {
              window.history.replaceState(
                {},
                "",
                stripGameReturnParams(new URL(window.location.href)),
              );
            } catch {
              /* ignore */
            }
          }
          const completedAfterGame = Array.isArray(nextProgress?.completed_lesson_ids)
            ? nextProgress.completed_lesson_ids
            : done.includes(returned.lessonId)
              ? done
              : [...done, returned.lessonId];
          const afterGame = await resolveLearnerProfileForLesson(userId, grade, {
            lessonId: returned.nextLessonId || returned.lessonId,
            completedLessonIds: completedAfterGame,
            persist: true,
            analyticsAttempts: 5,
            analyticsRetryDelayMs: 2500,
          });
          if (cancelled) return;
          if (afterGame.profile) setProfile(afterGame.profile);
          else if (resolved.profile) setProfile(resolved.profile);
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
    const done = Array.isArray(learnerProgress?.completed_lesson_ids)
      ? learnerProgress.completed_lesson_ids
      : completedLessonIds;
    const quizzes =
      learnerProgress?.quiz_by_lesson && typeof learnerProgress.quiz_by_lesson === "object"
        ? learnerProgress.quiz_by_lesson
        : quizByLesson;
    setCompletedLessonIds(done);
    setQuizByLesson(quizzes);

    const targetIndex = gradeLessons.findIndex((l) => l.lesson_id === lid);
    if (
      targetIndex >= 0 &&
      !isChapterUnlockedForLearning(targetIndex, gradeLessons, quizzes, done)
    ) {
      const pending = findPendingChapterGame(gradeLessons, done, quizzes);
      const msg = pending
        ? `Finish Game level ${pending.levelId} (${pending.title}) first — other chapters are locked until then.`
        : "This chapter is not available yet.";
      setChoiceError(msg);
      return { ok: false as const, error: msg };
    }

    // Fresh pull every lesson: analytics latest → stored LPE → IAE aptitude.
    const resolved = await resolveLearnerProfileForLesson(userId, grade, {
      lessonId: lid,
      completedLessonIds: done,
      persist: true,
      analyticsAttempts: done.length > 0 ? 4 : 1,
      analyticsRetryDelayMs: done.length > 0 ? 2500 : 0,
    });
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

      if (isTeacherLessonUnavailable(data)) {
        const meta = gradeLessons.find((l) => l.lesson_id === lid);
        const chapterTitle =
          meta?.display_title || meta?.title || data?.lesson_title || lid;
        alertTeacherLessonNotPublished(chapterTitle);
        setChoiceError(TEACHER_LESSON_NOT_PUBLISHED_MSG);
        return { ok: false as const, error: TEACHER_LESSON_NOT_PUBLISHED_MSG, data };
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
    setGameReturn(null);
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

  /** After a lesson, OK opens that chapter's farm level. */
  function onTestKnowledgeOk() {
    setTestKnowledgeOpen(false);
    const finished = gradeLessons.find(
      (l) => l.lesson_id === (finishedLessonId || result?.lesson_id || lessonId),
    );
    const params = buildChapterGameLaunchParams({
      lesson: finished || currentLessonMeta,
      gradeLessons,
    });
    if (params) {
      window.location.assign(buildGamingServiceLaunchUrl(params));
      return;
    }
    const fallback = readGamingLaunchParams();
    if (fallback) {
      window.location.assign(buildGamingServiceLaunchUrl(fallback));
      return;
    }
    window.location.assign(getGamingServiceBaseUrl());
  }

  function launchPendingChapterGame() {
    if (!pendingChapterGame) return;
    const params = buildChapterGameLaunchParams({
      lesson: pendingChapterGame.lesson,
      gradeLessons,
    });
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
      <div className="flex min-h-full flex-1 flex-col bg-brand-background">
        <Navbar />
        <FeatureShell className="flex flex-1 flex-col">
          <div className="relative flex-1 overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#70E00016,_transparent_42%),radial-gradient(ellipse_at_top_right,_#FF6B3512,_transparent_38%)]"
            />
            <main className="relative z-10 mx-auto w-full max-w-xl px-3 py-8 sm:px-5">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-brand-primary">
                Learning path
              </p>
              <h1 className="mb-4 text-2xl font-bold tracking-tight text-brand-text">
                {gameReturn ? "Farm complete — full syllabus unlocked" : "Chapter complete"}
              </h1>
              <Card className="border-brand-secondary/25 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-brand-text">Nice work</CardTitle>
                  <CardDescription>
                    You finished the farm for{" "}
                    <strong>
                      {gameReturn?.chapterTitle || finishedTitle}
                    </strong>
                    {gameReturn?.levelId ? ` (Game level ${gameReturn.levelId})` : ""}.
                    {gameReturn ? (
                      " Every chapter in this grade is now open — pick any one to study."
                    ) : nextMeta ? (
                      <>
                        {" "}
                        Play the farm for <strong>{finishedTitle}</strong> when you&apos;re
                        ready, or keep learning.
                      </>
                    ) : (
                      " That was the last chapter in this grade."
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {gameReturn?.unlockedLabels?.length ? (
                    <div className="rounded-xl border border-brand-secondary/25 bg-brand-secondary/10 px-3 py-2 text-sm text-brand-text">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
                        Items unlocked
                      </p>
                      <p className="mt-1 font-medium">
                        {gameReturn.unlockedLabels.join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-brand-text/60">
                        These will appear on your next chapter farm.
                      </p>
                    </div>
                  ) : null}

                  {nextMeta?.lesson_id ? (
                    <Button
                      disabled={choiceBusy}
                      className="bg-brand-primary text-white hover:bg-brand-primary/90"
                      onClick={() => void loadChosenChapter(nextMeta.lesson_id)}
                    >
                      {choiceBusy ? "Loading…" : `Learn next chapter: ${nextTitle}`}
                    </Button>
                  ) : (
                    <p className="text-sm text-brand-text/70">
                      That was the last chapter in this grade — pick a finished chapter to
                      review, or go home.
                    </p>
                  )}

                  <label htmlFor="pickChapter" className="text-sm font-medium text-brand-text">
                    Or pick any chapter
                  </label>
                  <p className="text-xs text-brand-text/70">
                    ✓ = lesson finished ({completedInGrade} of {gradeLessons.length}). After a
                    farm game, every chapter is open.
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
                    {gradeLessons.map((l, i) => {
                      const unlocked = isLessonUnlocked(i);
                      return (
                        <option key={l.lesson_id} value={l.lesson_id} disabled={!unlocked}>
                          {chapterOptionLabel(l, i)}
                          {l.lesson_id === finishedLessonId ? " · farm just finished" : ""}
                          {!unlocked ? " · locked" : ""}
                        </option>
                      );
                    })}
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
                    <Button
                      variant="outline"
                      disabled={choiceBusy}
                      onClick={goHomeSetup}
                      className="border-brand-surface"
                    >
                      Back to chapters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </FeatureShell>
      </div>
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
      <>
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
            levelId={farmLevelFromLessonId(result?.lesson_id || lessonId, gradeLessons)}
            rewardLabel={chapterRewardLabel(
              chapterRewardItemId(
                farmLevelFromLessonId(result?.lesson_id || lessonId, gradeLessons),
              ),
            )}
            onOk={onTestKnowledgeOk}
          />
        </FeatureShell>
        <SocratesChatToggle />
      </>
    );
  }

  const learnerName = sessionName || "Science explorer";
  const learningLevel = PROFILE_LABEL[profile || ""] || "Aptitude test pending";
  const totalLessons = gradeLessons.length;
  const pendingInGrade = Math.max(0, totalLessons - completedInGrade);
  const progressPercent = totalLessons
    ? Math.round((completedInGrade / totalLessons) * 100)
    : 0;
  const selectedLesson = gradeLessons.find((lesson) => lesson.lesson_id === lessonId);
  const selectedIndex = gradeLessons.findIndex((l) => l.lesson_id === lessonId);
  const selectedUnlocked =
    selectedIndex < 0 ? Boolean(lessonId) : isLessonUnlocked(selectedIndex);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <Navbar />
      <FeatureShell className="flex flex-1 flex-col">
        <div className="relative flex-1 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#70E00016,_transparent_42%),radial-gradient(ellipse_at_top_right,_#7209B712,_transparent_38%)]"
          />

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 sm:px-5 sm:py-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <span className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/25">
                  <BookOpen className="size-6" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-brand-primary">
                    <Sparkles className="size-3.5" aria-hidden />
                    Learning path
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
                    Your science chapters
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-brand-text/65 sm:text-base">
                    Pick any chapter to start or revise. Finish a pending farm game to unlock
                    the full syllabus for this grade.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="border-brand-surface bg-white text-brand-text hover:bg-brand-background"
                >
                  <Link href={STUDENT_HOME_PATH}>
                    <ArrowLeft className="size-4" aria-hidden />
                    Dashboard
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-brand-special text-white hover:bg-brand-special/90"
                >
                  <Link href={STUDENT_AR_LIBRARY_PATH}>
                    <ScanLine className="size-4" aria-hidden />
                    AR Library
                  </Link>
                </Button>
              </div>
            </header>

            <section className="rounded-2xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold text-brand-text sm:text-2xl">
                      {learnerName}
                    </h2>
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
                  <div className="rounded-xl bg-brand-secondary/15 px-3 py-3 text-center ring-1 ring-brand-secondary/20">
                    <p className="text-2xl font-bold text-brand-text sm:text-3xl">
                      {completedInGrade}
                    </p>
                    <p className="text-xs font-medium text-brand-text/60">Completed</p>
                  </div>
                  <div className="rounded-xl bg-brand-accent/15 px-3 py-3 text-center ring-1 ring-brand-accent/20">
                    <p className="text-2xl font-bold text-brand-text sm:text-3xl">
                      {pendingInGrade}
                    </p>
                    <p className="text-xs font-medium text-brand-text/60">Pending</p>
                  </div>
                  <div className="rounded-xl bg-brand-primary/15 px-3 py-3 text-center ring-1 ring-brand-primary/20">
                    <p className="text-2xl font-bold text-brand-text sm:text-3xl">
                      {progressPercent}%
                    </p>
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

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-brand-secondary">
                    Syllabus
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-brand-text sm:text-xl">
                    Choose a chapter
                  </h2>
                  <p className="mt-1 text-sm text-brand-text/60">
                    When a farm game is waiting, only that chapter stays open — finish the
                    farm to unlock the full syllabus. After that, pick any chapter you like.
                  </p>
                </div>
                {sessionGrade == null ? (
                  <div className="flex flex-wrap gap-1 rounded-xl border border-brand-surface bg-white p-1 shadow-sm">
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

              {pendingChapterGame ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-brand-special/25 bg-brand-special/8 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-special">
                      Game level {pendingChapterGame.levelId} ready
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-text">
                      Play the farm for {pendingChapterGame.title}
                    </p>
                    <p className="mt-1 text-xs text-brand-text/60">
                      Finish this farm to unlock the full syllabus for this grade.{" "}
                      {pendingChapterGame.rewardLabel} is waiting on the farm.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-brand-special text-white hover:bg-brand-special/90"
                    onClick={launchPendingChapterGame}
                  >
                    <Gamepad2 className="size-4" aria-hidden />
                    Play Game Level {pendingChapterGame.levelId}
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-brand-text/60">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-brand-secondary" aria-hidden />
                  Lesson finished
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-brand-surface ring-1 ring-brand-text/15" aria-hidden />
                  Unlocked
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="size-3" aria-hidden />
                  Locked until pending farm is done
                </span>
              </div>

              {gradeLessons.length ? (
                <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {gradeLessons.map((lesson, index) => {
                    const complete = completedSet.has(lesson.lesson_id);
                    const unlocked = isLessonUnlocked(index);
                    const selected = lesson.lesson_id === lessonId;
                    const title = lesson.display_title || lesson.title || lesson.lesson_id;
                    const pending =
                      pendingChapterGame?.lessonId === lesson.lesson_id;
                    const status = !unlocked
                      ? pendingChapterGame
                        ? `Locked — finish Game level ${pendingChapterGame.levelId} first`
                        : "Not available yet"
                      : pending
                        ? `Farm level ${pendingChapterGame.levelId} ready`
                        : complete
                          ? "Completed — revise"
                          : "Not started";
                    return (
                      <li key={lesson.lesson_id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!unlocked) {
                              setChoiceError(status);
                              return;
                            }
                            setLessonId(lesson.lesson_id);
                            setChoiceError("");
                          }}
                          aria-pressed={selected}
                          aria-disabled={!unlocked}
                          className={`m-0 flex h-full w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                            !unlocked
                              ? "cursor-not-allowed border-brand-surface bg-brand-surface/40 opacity-75"
                              : "hover:-translate-y-0.5"
                          } ${
                            unlocked && selected
                              ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                              : unlocked && complete
                                ? "border-brand-secondary/40 bg-brand-secondary/5 hover:border-brand-secondary"
                                : unlocked
                                  ? "border-brand-surface bg-white hover:border-brand-primary"
                                  : ""
                          }`}
                        >
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              !unlocked
                                ? "bg-brand-surface text-brand-text/50"
                                : complete
                                  ? "bg-brand-secondary text-brand-text"
                                  : selected
                                    ? "bg-brand-primary text-white"
                                    : "bg-brand-surface text-brand-text/70"
                            }`}
                          >
                            {!unlocked ? (
                              <Lock className="size-4" aria-hidden />
                            ) : complete ? (
                              <Check className="size-5" aria-hidden />
                            ) : (
                              index + 1
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-brand-text">{title}</span>
                            <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-text/55">
                              {pending ? (
                                <Gamepad2 className="size-3.5" aria-hidden />
                              ) : (
                                <BookOpen className="size-3.5" aria-hidden />
                              )}
                              {status}
                            </span>
                          </span>
                          {selected && unlocked ? (
                            <ChevronRight
                              className="mt-1 size-4 shrink-0 text-brand-primary"
                              aria-hidden
                            />
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
                <p className="rounded-xl border border-brand-accent/25 bg-brand-accent/10 px-3 py-2 text-sm font-medium text-brand-accent">
                  {choiceError}
                </p>
              ) : null}

              {!backendOnline ? (
                <p className="rounded-xl border border-brand-accent/25 bg-brand-accent/10 px-3 py-2 text-sm font-medium text-brand-accent">
                  Cannot reach the learning service. Make sure it is running, then try again.
                </p>
              ) : null}

              <div className="sticky bottom-4 z-10 mt-2 flex flex-col items-stretch gap-4 rounded-2xl border border-brand-primary/20 bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wide text-brand-text/50 uppercase">
                    Selected chapter
                  </p>
                  <p className="mt-0.5 truncate text-base font-semibold text-brand-text">
                    {selectedLesson
                      ? selectedLesson.display_title ||
                        selectedLesson.title ||
                        selectedLesson.lesson_id
                      : "Choose a chapter above"}
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !lessonId ||
                    !backendOnline ||
                    !userId ||
                    !selectedUnlocked
                  }
                  className="m-0 h-12 w-full shrink-0 border-0 bg-brand-primary px-8 text-base text-white hover:bg-brand-primary/90 sm:w-auto"
                >
                  {loading ? "Preparing lesson…" : "Start lesson"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </FeatureShell>
    </div>
  );
}
