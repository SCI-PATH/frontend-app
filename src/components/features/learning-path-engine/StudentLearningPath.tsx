"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { isOfflineError, notifyUserFacingError, toUserFacingMessage } from "./errors.js";
import FeatureShell from "./FeatureShell";
import { useAppStore } from "./store/appStore.js";

const GRADE_OPTIONS = [6, 7, 8, 9];
const LESSON_EVENT = "lesson_start";

const PROFILE_LABEL: Record<string, string> = {
  weak: "Weak",
  average: "Average",
  strong: "Smart",
  smart: "Smart",
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

  const [userId, setUserId] = useState(sessionUserId || "demo-1");
  const [grade, setGrade] = useState(sessionGrade || 7);
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
    let cancelled = false;
    Promise.all([getCurriculum(grade), getProgress(userId)])
      .then(([c, p]) => {
        if (cancelled) return;
        setBackendOnline(true);
        setCurriculum(c);
        const done = Array.isArray(p?.completed_lesson_ids) ? p.completed_lesson_ids : [];
        setCompletedLessonIds(done);
        const lessons = c?.lessons || [];
        const locked = viewRef.current === "chapterChoice" || viewRef.current === "lesson";
        if (locked) {
          if (p?.derived_profile) setProfile(p.derived_profile);
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
        if (p?.derived_profile) setProfile(p.derived_profile);
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
    if (!learnerProgress?.derived_profile) {
      const msg =
        "Complete the aptitude test first. Your result will unlock lessons at the right learning level.";
      setChoiceError(msg);
      return { ok: false as const, error: msg };
    }
    setProfile(learnerProgress.derived_profile);

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
      try {
        const p = await postProgress({
          user_id: userId,
          action: "mark_complete",
          lesson_id: finishedId,
          grade,
        });
        if (Array.isArray(p?.completed_lesson_ids)) {
          setCompletedLessonIds(p.completed_lesson_ids);
        } else {
          setCompletedLessonIds((prev) =>
            prev.includes(finishedId) ? prev : [...prev, finishedId],
          );
        }
      } catch {
        setCompletedLessonIds((prev) =>
          prev.includes(finishedId) ? prev : [...prev, finishedId],
        );
      }
    }
    await openChapterChoice(finishedId);
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
      </FeatureShell>
    );
  }

  return (
    <FeatureShell>
      <main className="mx-auto max-w-xl px-4 py-8">
        <header className="mb-6">
          <p className="text-sm font-medium text-brand-primary">SCI-PATH</p>
          <h1 className="text-2xl font-semibold text-brand-text">Start a lesson</h1>
          {sessionName ? (
            <p className="mt-1 text-sm text-brand-text/70">Signed in as {sessionName}</p>
          ) : null}
        </header>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Chapter selection</CardTitle>
            <CardDescription>
              After your aptitude test, choose Chapter 1 or any chapter in your grade. Lessons use
              the level from the question engine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={onSubmit}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setView("explore")}
              >
                Open science map
              </Button>

              <label htmlFor="userId" className="text-sm font-medium">
                Student id
              </label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={Boolean(sessionUserId)}
              />

              <label htmlFor="grade" className="text-sm font-medium">
                Grade
              </label>
              <select
                id="grade"
                className={selectClassName}
                value={grade}
                onChange={(e) => void onGradeChange(e.target.value)}
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>

              <label htmlFor="lessonId" className="text-sm font-medium">
                Chapter
              </label>
              <select
                id="lessonId"
                className={selectClassName}
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
              >
                <option value="">Choose…</option>
                {gradeLessons.map((l, i) => (
                  <option key={l.lesson_id} value={l.lesson_id}>
                    {chapterOptionLabel(l, i)}
                  </option>
                ))}
              </select>

              {gradeLessons.length > 0 ? (
                <p className="text-xs text-brand-text/70">
                  Progress: <strong>{completedInGrade}</strong> / {gradeLessons.length} chapters
                  done. ✓ means finished — you can still relearn.
                </p>
              ) : null}

              <p className="text-sm text-brand-text/80">
                Learning level:{" "}
                <strong>{PROFILE_LABEL[profile || ""] || "Pending aptitude test"}</strong>
              </p>

              {choiceError ? (
                <p className="text-sm text-brand-accent">{choiceError}</p>
              ) : null}

              <Button
                type="submit"
                disabled={loading || !lessonId || !backendOnline}
                className="bg-brand-primary text-white hover:bg-brand-primary/90"
              >
                {loading ? "Loading lesson…" : "Start lesson"}
              </Button>

              {!backendOnline ? (
                <p className="text-sm text-brand-accent">
                  Cannot reach the learning service. Make sure it is running, then try again.
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </main>
    </FeatureShell>
  );
}
