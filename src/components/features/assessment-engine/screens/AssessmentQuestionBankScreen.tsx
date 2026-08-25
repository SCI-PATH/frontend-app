"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  approveTeacherQuestion,
  fetchMostMissedQuestions,
  fetchTeacherQuestions,
  fetchTeacherQuestionsAllStatuses,
  fetchTeacherTopics,
  generateTeacherQuestions,
  rejectTeacherQuestion,
} from "../api/teacher";
import { AddCustomQuestionDialog } from "../components/question-bank/AddCustomQuestionDialog";
import { AssessmentShell } from "../components/AssessmentShell";
import { normalizeOptions } from "../components/QuestionRenderer";
import { useAssessmentUser } from "../store/useAssessmentUser";
import type {
  MostMissedQuestionInsight,
  QuestionType,
  RejectReason,
  TeacherQuestion,
  TeacherTopic,
} from "../types";
import { AssessmentApiError } from "../types";
import {
  chapterIdFromTopicId,
  chaptersFromTopics,
  topicsForChapter,
} from "../utils/topicChapter";
import { EDUCATOR_HOME_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

const REJECT_REASONS: { value: RejectReason; label: string; highlight?: boolean }[] =
  [
    { value: "FACTUAL_ERROR", label: "Factual error", highlight: true },
    { value: "OUT_OF_SCOPE", label: "Out of scope" },
    { value: "POOR_PHRASING", label: "Poor phrasing" },
    { value: "TOO_EASY", label: "Too easy" },
    { value: "TOO_HARD", label: "Too hard" },
    { value: "OTHER", label: "Other" },
  ];

const Q_TYPES: QuestionType[] = [
  "MCQ",
  "TrueFalse",
  "ShortAnswer",
  "MultiBlank",
];

type StatusFilter = "pending" | "approved" | "rejected" | "all";

type LoadOverrides = {
  status?: StatusFilter;
  grade?: number;
  classCode?: string;
  dok?: string;
  qType?: string;
  chapterId?: string;
  /** When set, fetch this topic from the API (most reliable after Generate). */
  topicId?: string;
  /** Avoid full-page spinner when we already show optimistic results. */
  quiet?: boolean;
};

export function AssessmentQuestionBankScreen() {
  const user = useAssessmentUser();
  const [grade, setGrade] = useState(user.grade ?? 7);
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [chapterId, setChapterId] = useState("");
  const [dok, setDok] = useState("");
  const [qType, setQType] = useState("");
  const [classCode, setClassCode] = useState(user.classCode ?? "");

  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [topics, setTopics] = useState<TeacherTopic[]>([]);
  const [mostMissed, setMostMissed] = useState<MostMissedQuestionInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  /** Ignores stale in-flight list responses (common after Generate filter changes). */
  const loadSeqRef = useRef(0);
  /** Skip one auto-load after Generate already refreshed with explicit overrides. */
  const skipNextAutoLoadRef = useRef(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TeacherQuestion | null>(null);
  const [rejectReason, setRejectReason] =
    useState<RejectReason>("FACTUAL_ERROR");
  const [rejectNotes, setRejectNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Soft placeholder after reject until a real regenerate endpoint exists. */
  const [replacementPlaceholder, setReplacementPlaceholder] = useState<{
    topicId?: string;
    reason: string;
  } | null>(null);

  const [genChapter, setGenChapter] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genDok, setGenDok] = useState("2");
  const [genType, setGenType] = useState<QuestionType>("MCQ");
  const [generating, setGenerating] = useState(false);

  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    setClassCode(user.classCode ?? "");
  }, [user.classCode]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const chapterOptions = useMemo(() => chaptersFromTopics(topics), [topics]);
  const genTopics = useMemo(
    () => topicsForChapter(topics, genChapter),
    [topics, genChapter]
  );

  const loadTopics = useCallback(async () => {
    try {
      const list = await fetchTeacherTopics(grade);
      setTopics(list);
      const chapters = chaptersFromTopics(list);
      if (chapters[0]) {
        setGenChapter((prev) => prev || chapters[0].id);
        setChapterId((prev) => prev);
      }
      const firstTopic = list[0]?.topic_id;
      if (firstTopic) setGenTopic((prev) => prev || firstTopic);
    } catch {
      setTopics([]);
    }
  }, [grade]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    if (!genTopics.length) return;
    if (!genTopics.some((t) => t.topic_id === genTopic)) {
      setGenTopic(genTopics[0].topic_id);
    }
  }, [genTopics, genTopic]);

  const load = useCallback(async (overrides?: LoadOverrides) => {
    const seq = ++loadSeqRef.current;
    const nextStatus = overrides?.status ?? status;
    const nextGrade = overrides?.grade ?? grade;
    const nextClass = overrides?.classCode ?? classCode;
    const nextDok = overrides?.dok ?? dok;
    const nextType = overrides?.qType ?? qType;
    const nextChapter = overrides?.chapterId ?? chapterId;
    const nextTopic = overrides?.topicId;
    const quiet = overrides?.quiet === true;

    if (!quiet) setLoading(true);
    setError(null);
    try {
      const base = {
        grade: nextGrade,
        class_code: nextClass || undefined,
        dok_level: nextDok ? Number(nextDok) : undefined,
        question_type: (nextType as QuestionType) || undefined,
        topic_id: nextTopic || undefined,
        limit: 100,
      };

      let list: TeacherQuestion[];
      if (nextStatus === "all") {
        list = await fetchTeacherQuestionsAllStatuses(base);
      } else {
        list = await fetchTeacherQuestions({ ...base, status: nextStatus });
      }

      // Topic-scoped fetches already match; chapter filter is client-side only.
      if (nextChapter && !nextTopic) {
        list = list.filter(
          (q) =>
            chapterIdFromTopicId(q.topic_id) === nextChapter.toUpperCase()
        );
      }

      if (seq !== loadSeqRef.current) return;
      setQuestions(list);
    } catch (err) {
      if (seq !== loadSeqRef.current) return;
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not load questions"
      );
    } finally {
      if (seq === loadSeqRef.current && !quiet) setLoading(false);
    }
  }, [status, grade, classCode, dok, qType, chapterId]);

  useEffect(() => {
    if (skipNextAutoLoadRef.current) {
      skipNextAutoLoadRef.current = false;
      return;
    }
    void load();
  }, [load]);

  useEffect(() => {
    void fetchMostMissedQuestions({
      grade,
      class_code: classCode || undefined,
      limit: 8,
    })
      .then(setMostMissed)
      .catch(() => setMostMissed([]));
  }, [grade, classCode]);

  async function handleApprove(q: TeacherQuestion) {
    setBusyId(q.id);
    setError(null);
    try {
      await approveTeacherQuestion(q.id);
      setToast("Question approved.");
      setReplacementPlaceholder(null);
      await load();
    } catch (err) {
      setError(
        err instanceof AssessmentApiError ? err.message : "Approve failed"
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    setError(null);
    try {
      await rejectTeacherQuestion(rejectTarget.id, {
        reason: rejectReason,
        notes: rejectNotes || undefined,
      });
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectNotes("");
      // Clear sticky banners — show a clean replacement placeholder instead.
      setToast(null);
      setReplacementPlaceholder({
        topicId: rejectTarget.topic_id,
        reason: rejectReason.replace(/_/g, " ").toLowerCase(),
      });
      setStatus("pending");
      await load();
    } catch (err) {
      setError(
        err instanceof AssessmentApiError ? err.message : "Reject failed"
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleGenerate() {
    if (!genTopic.trim()) {
      setError("Select a chapter and topic before generating.");
      return;
    }
    setGenerating(true);
    setError(null);
    setToast(null);
    const topicId = genTopic.trim();
    const topicMeta = topics.find((t) => t.topic_id === topicId);
    const nextGrade = topicMeta?.grade ?? grade;
    const nextChapter =
      genChapter || chapterIdFromTopicId(topicId) || chapterId;

    try {
      const result = await generateTeacherQuestions({
        topic_id: topicId,
        skill: topicMeta?.skill,
        dok_level: Number(genDok) || 2,
        question_type: genType,
        count: 1,
      });

      // Align queue filters so the new item is not hidden by DOK/type/chapter.
      // (Previously await load() used a stale closure and wiped the optimistic list.)
      skipNextAutoLoadRef.current = true;
      setStatus("pending");
      setGrade(nextGrade);
      setChapterId(nextChapter);
      setDok("");
      setQType("");
      setReplacementPlaceholder(null);

      if (result.created === 0 || result.questions.length === 0) {
        setError(
          "No questions were created. The LLM may have failed validation, or there is no RAG context for this topic. Try again or pick another topic/chapter."
        );
        await load({
          status: "pending",
          grade: nextGrade,
          chapterId: nextChapter,
          dok: "",
          qType: "",
          topicId,
        });
        return;
      }

      setQuestions(result.questions);
      setToast(
        `Generated ${result.questions.length} pending question${
          result.questions.length === 1 ? "" : "s"
        }.`
      );

      // Confirm from API scoped to this topic (avoids grade/filter misses).
      await load({
        status: "pending",
        grade: nextGrade,
        chapterId: nextChapter,
        dok: "",
        qType: "",
        topicId,
        quiet: true,
      });
      // Keep generate payload visible even if a racey list response was empty.
      setQuestions((prev) => {
        const byId = new Map(prev.map((q) => [q.id, q]));
        for (const q of result.questions) byId.set(q.id, q);
        return Array.from(byId.values());
      });
    } catch (err) {
      setError(
        err instanceof AssessmentApiError ? err.message : "Generate failed"
      );
    } finally {
      setGenerating(false);
    }
  }

  if (user.role !== "educator") {
    return (
      <AssessmentShell
        title="Question bank"
        subtitle="Educator tools"
        backHref={EDUCATOR_HOME_PATH}
        backLabel="Teacher home"
      >
        <div className="rounded-[2rem] border border-brand-surface bg-white px-6 py-12 text-center text-sm text-brand-text/70">
          Sign in with an educator account to review and manage the question
          bank.
        </div>
      </AssessmentShell>
    );
  }

  return (
    <AssessmentShell
      title="Question bank"
      subtitle="Generate, review, and curate assessment items for your classes."
      maxWidth="5xl"
      backHref={EDUCATOR_HOME_PATH}
      backLabel="Teacher home"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            className="rounded-xl border-brand-surface"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="rounded-xl bg-brand-accent text-white hover:bg-brand-accent/90"
          >
            <Plus className="size-3.5" aria-hidden />
            Add question
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <section className="overflow-hidden rounded-[1.75rem] border border-brand-surface bg-white shadow-sm">
          <BrandGradientBar />
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                <ClipboardList className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-brand-text">Filters</h2>
                <p className="text-sm text-brand-text/55">
                  Narrow the review queue by chapter, depth, and type
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <FilterSelect
                label="Status"
                value={status}
                onChange={(v) => setStatus(v as StatusFilter)}
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "all", label: "All" },
                ]}
              />
              <FilterSelect
                label="Grade"
                value={String(grade)}
                onChange={(v) => setGrade(Number(v))}
                options={[6, 7, 8, 9].map((g) => ({
                  value: String(g),
                  label: `Grade ${g}`,
                }))}
              />
              <FilterSelect
                label="Chapter ID"
                value={chapterId}
                onChange={setChapterId}
                options={[
                  { value: "", label: "All chapters" },
                  ...chapterOptions.map((c) => ({
                    value: c.id,
                    label: c.label,
                  })),
                ]}
              />
              <FilterSelect
                label="DOK"
                value={dok}
                onChange={setDok}
                options={[
                  { value: "", label: "Any" },
                  { value: "1", label: "1" },
                  { value: "2", label: "2" },
                  { value: "3", label: "3" },
                  { value: "4", label: "4" },
                ]}
              />
              <FilterSelect
                label="Question type"
                value={qType}
                onChange={setQType}
                options={[
                  { value: "", label: "Any" },
                  ...Q_TYPES.map((t) => ({ value: t, label: t })),
                ]}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
                  Class code
                </label>
                <Input
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="Optional"
                  className="h-10 rounded-xl border-brand-surface"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Most missed */}
        <section className="overflow-hidden rounded-[1.75rem] border border-brand-accent/20 bg-gradient-to-br from-white to-brand-accent/5 shadow-sm">
          <div className="space-y-3 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent text-white shadow-md shadow-brand-accent/25">
                <AlertTriangle className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-brand-text">
                  Most missed questions
                </h2>
                <p className="text-sm text-brand-text/60">
                  Spot items students miss most — a flawed stem to reject, or a
                  class learning gap to reteach.
                </p>
              </div>
            </div>
            {mostMissed.length > 0 ? (
              <ul className="space-y-2">
                {mostMissed.map((row) => (
                  <li
                    key={row.question_id}
                    className="rounded-2xl border border-brand-surface bg-white px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium text-brand-text">
                        {row.prompt || row.question_id}
                      </p>
                      <Badge className="bg-brand-accent/15 text-brand-accent hover:bg-brand-accent/15">
                        {row.incorrect_count}/{row.attempt_count} missed
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-brand-accent/30 bg-white/70 px-4 py-6 text-center text-sm text-brand-text/60">
                {/* TODO(IAE): GET /teacher/insights/most-missed from analytics_events */}
                No miss-rate insights yet. Once the teacher insights endpoint is
                live, the hardest items will appear here automatically.
              </div>
            )}
          </div>
        </section>

        {/* Generate */}
        <section className="overflow-hidden rounded-[1.75rem] border border-brand-special/20 bg-gradient-to-br from-white to-brand-special/5 shadow-sm">
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-special text-white shadow-md shadow-brand-special/25">
                <Wand2 className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-brand-text">
                  Generate (RAG → pending)
                </h2>
                <p className="text-sm text-brand-text/55">
                  Create draft items from the syllabus catalog for grade {grade}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect
                label="Chapter ID"
                value={genChapter}
                onChange={setGenChapter}
                options={chapterOptions.map((c) => ({
                  value: c.id,
                  label: c.label,
                }))}
              />
              <FilterSelect
                label="Topic"
                value={genTopic}
                onChange={setGenTopic}
                options={genTopics.map((t) => ({
                  value: t.topic_id,
                  label: t.skill || t.name || t.topic_id,
                }))}
              />
              <FilterSelect
                label="DOK"
                value={genDok}
                onChange={setGenDok}
                options={[1, 2, 3, 4].map((d) => ({
                  value: String(d),
                  label: `DOK ${d}`,
                }))}
              />
              <FilterSelect
                label="Question type"
                value={genType}
                onChange={(v) => setGenType(v as QuestionType)}
                options={Q_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </div>
            <Button
              disabled={generating || !genTopic}
              onClick={() => void handleGenerate()}
              className="rounded-xl bg-brand-special text-white hover:bg-brand-special/90"
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Wand2 className="size-4" aria-hidden />
              )}
              Generate
            </Button>
          </div>
        </section>

        {toast ? (
          <p className="rounded-2xl border border-brand-secondary/30 bg-brand-secondary/10 px-4 py-3 text-sm text-brand-text animate-in fade-in">
            {toast}
          </p>
        ) : null}
        {error ? (
          <p
            className="rounded-2xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {replacementPlaceholder ? (
          <div className="rounded-[1.75rem] border border-dashed border-brand-primary/30 bg-brand-primary/5 px-5 py-6 text-center">
            <Sparkles className="mx-auto size-6 text-brand-primary" aria-hidden />
            <p className="mt-2 font-semibold text-brand-text">
              Coming soon: Replacement question being generated
            </p>
            <p className="mt-1 text-sm text-brand-text/60">
              The previous item was rejected
              {replacementPlaceholder.reason
                ? ` (${replacementPlaceholder.reason})`
                : ""}
              . Use Generate above to draft a replacement
              {replacementPlaceholder.topicId
                ? ` for ${replacementPlaceholder.topicId}`
                : ""}
              .
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 rounded-xl border-brand-surface"
              onClick={() => setReplacementPlaceholder(null)}
            >
              Dismiss
            </Button>
          </div>
        ) : null}

        {/* Queue */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-brand-primary" />
          </div>
        ) : (
          <ul className="space-y-3">
            {questions.length === 0 ? (
              <li className="rounded-[1.75rem] border border-brand-surface bg-white px-6 py-12 text-center text-sm text-brand-text/60">
                No questions match these filters.
              </li>
            ) : null}
            {questions.map((q) => (
              <li key={q.id}>
                <article className="rounded-[1.75rem] border border-brand-surface bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
                          {q.question_type}
                        </Badge>
                        {q.dok_level != null ? (
                          <Badge variant="outline">DOK {q.dok_level}</Badge>
                        ) : null}
                        {chapterIdFromTopicId(q.topic_id) ? (
                          <Badge variant="outline">
                            {chapterIdFromTopicId(q.topic_id)}
                          </Badge>
                        ) : null}
                        <StatusBadge status={q.status} />
                      </div>
                      <h3 className="text-base font-semibold leading-snug text-brand-text">
                        {q.prompt}
                      </h3>
                      {q.options ? (
                        <ul className="space-y-1 text-sm text-brand-text/75">
                          {normalizeOptions(q.options).map((opt) => (
                            <li key={opt.key}>
                              <span className="font-semibold text-brand-primary">
                                {opt.key}.
                              </span>{" "}
                              {opt.label}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {q.paragraph && q.paragraph !== q.prompt ? (
                        <p className="text-sm whitespace-pre-wrap text-brand-text/70">
                          {q.paragraph}
                        </p>
                      ) : null}
                      {q.expected_answer ? (
                        <p className="text-xs text-brand-text/50">
                          Expected: {q.expected_answer}
                        </p>
                      ) : null}
                      {q.status === "rejected" && q.rejection_reason ? (
                        <p className="text-xs text-brand-text/45">
                          Rejected · {q.rejection_reason.replace(/_/g, " ")}
                        </p>
                      ) : null}
                    </div>

                    {(q.status === "pending" || q.status === "approved") && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {q.status === "pending" ? (
                          <Button
                            size="sm"
                            disabled={busyId === q.id}
                            onClick={() => void handleApprove(q)}
                            className="rounded-xl bg-brand-secondary text-brand-text hover:bg-brand-secondary/90"
                          >
                            <Check className="size-3.5" aria-hidden />
                            Approve
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === q.id}
                          onClick={() => {
                            setRejectTarget(q);
                            setRejectReason("FACTUAL_ERROR");
                            setRejectNotes("");
                            setRejectOpen(true);
                          }}
                          className="rounded-xl border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10"
                        >
                          <X className="size-3.5" aria-hidden />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            setRejectTarget(null);
            setRejectNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject question</DialogTitle>
            <DialogDescription>
              Choose a reason. Factual errors may trigger an AI confirmation
              check on the server.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-2">
              {REJECT_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRejectReason(r.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    rejectReason === r.value
                      ? r.highlight
                        ? "border-brand-accent bg-brand-accent text-white"
                        : "border-brand-primary bg-brand-primary text-white"
                      : "border-brand-surface bg-white text-brand-text"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Input
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="border-brand-surface"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleRejectConfirm()}
              className="bg-brand-accent text-white hover:bg-brand-accent/90"
            >
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddCustomQuestionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        grade={grade}
        topics={topics}
        defaultChapterId={chapterId || genChapter}
        defaultDok={dok ? Number(dok) : 2}
        onCreated={() => {
          setToast("Custom question added.");
          setStatus("approved");
          void load();
        }}
      />
    </AssessmentShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <Badge className="bg-brand-secondary/20 text-brand-text hover:bg-brand-secondary/20">
        approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-brand-text/10 text-brand-text/70 hover:bg-brand-text/10">
        rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-brand-special/15 text-brand-special hover:bg-brand-special/15">
      pending
    </Badge>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-brand-surface bg-white px-3 text-sm text-brand-text"
      >
        {options.length === 0 ? (
          <option value="">None</option>
        ) : (
          options.map((o) => (
            <option key={o.value || `${label}-all`} value={o.value}>
              {o.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
