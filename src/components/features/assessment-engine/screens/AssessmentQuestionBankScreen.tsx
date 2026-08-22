"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Wand2,
  X,
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
  createTeacherQuestion,
  fetchTeacherQuestions,
  fetchTeacherTopics,
  generateTeacherQuestions,
  rejectTeacherQuestion,
} from "../api/teacher";
import { useAssessmentUser } from "../store/useAssessmentUser";
import type {
  QuestionType,
  RejectReason,
  TeacherQuestion,
  TeacherTopic,
} from "../types";
import { AssessmentApiError } from "../types";
import { AssessmentShell } from "../components/AssessmentShell";
import { normalizeOptions } from "../components/QuestionRenderer";
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

export function AssessmentQuestionBankScreen() {
  const user = useAssessmentUser();
  const [grade, setGrade] = useState(7);
  const [status, setStatus] = useState("pending");
  const [dok, setDok] = useState<string>("");
  const [qType, setQType] = useState<string>("");
  const [classCode, setClassCode] = useState(user.classCode ?? "");
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [topics, setTopics] = useState<TeacherTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TeacherQuestion | null>(null);
  const [rejectReason, setRejectReason] =
    useState<RejectReason>("FACTUAL_ERROR");
  const [rejectNotes, setRejectNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [genTopic, setGenTopic] = useState("");
  const [genDok, setGenDok] = useState("2");
  const [genType, setGenType] = useState<QuestionType>("MCQ");
  const [genCount, setGenCount] = useState(1);
  const [generating, setGenerating] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addPrompt, setAddPrompt] = useState("");
  const [addAnswer, setAddAnswer] = useState("");
  const [addType, setAddType] = useState<QuestionType>("MCQ");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setClassCode(user.classCode ?? "");
  }, [user.classCode]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchTeacherQuestions({
        status: status || undefined,
        grade,
        class_code: classCode || undefined,
        dok_level: dok ? Number(dok) : undefined,
        question_type: (qType as QuestionType) || undefined,
      });
      setQuestions(list);
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not load questions"
      );
    } finally {
      setLoading(false);
    }
  }, [status, grade, classCode, dok, qType]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchTeacherTopics(grade)
      .then((t) => {
        setTopics(t);
        if (t[0] && !genTopic) setGenTopic(t[0].topic_id);
      })
      .catch(() => setTopics([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade]);

  async function handleApprove(q: TeacherQuestion) {
    setBusyId(q.id);
    setMessage(null);
    try {
      await approveTeacherQuestion(q.id);
      setMessage(`Approved question ${q.id}`);
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
    setMessage(null);
    try {
      const res = await rejectTeacherQuestion(rejectTarget.id, {
        reason: rejectReason,
        notes: rejectNotes || undefined,
      });
      const aiNote =
        res.rejection_confirmed_ai === true
          ? " · AI confirmed factual error"
          : "";
      setMessage(`Rejected (${rejectReason})${aiNote}`);
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectNotes("");
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
      setError("Select or enter a topic_id before generating.");
      return;
    }
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      await generateTeacherQuestions({
        topic_id: genTopic.trim(),
        dok_level: Number(genDok) || 2,
        question_type: genType,
        count: Math.max(1, genCount),
      });
      setMessage("Generation requested — refresh the pending queue.");
      await load();
    } catch (err) {
      setError(
        err instanceof AssessmentApiError ? err.message : "Generate failed"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleAdd() {
    if (!addPrompt.trim() || !addAnswer.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await createTeacherQuestion({
        prompt: addPrompt.trim(),
        expected_answer: addAnswer.trim(),
        question_type: addType,
        grade,
        class_code: classCode || undefined,
        dok_level: dok ? Number(dok) : 2,
      });
      setAddOpen(false);
      setAddPrompt("");
      setAddAnswer("");
      setMessage("Custom question added.");
      await load();
    } catch (err) {
      setError(
        err instanceof AssessmentApiError ? err.message : "Create failed"
      );
    } finally {
      setAdding(false);
    }
  }

  if (user.role !== "educator") {
    return (
      <AssessmentShell
        title="Question bank"
        subtitle="Educator tools"
        backHref="/educator-home"
        backLabel="Educator home"
      >
        <Card className="border-brand-surface bg-white">
          <CardContent className="py-10 text-center text-sm text-brand-text/70">
            Sign in with an educator account to review and manage the question
            bank.
          </CardContent>
        </Card>
      </AssessmentShell>
    );
  }

  return (
    <AssessmentShell
      title="Assessment question bank"
      subtitle="Component 2 review · approve / reject / generate — not the classroom matrix"
      maxWidth="5xl"
      backHref="/educator-home"
      backLabel="Educator home"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            className="border-brand-surface"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            <Plus className="size-3.5" aria-hidden />
            Add question
          </Button>
        </>
      }
    >
      <Card className="mb-4 border-brand-surface bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-brand-text">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "", label: "All" },
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
          <div className="space-y-1">
            <label className="text-xs font-medium text-brand-text/60">
              Class code
            </label>
            <Input
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              className="h-9 w-28 border-brand-surface"
            />
          </div>
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
            label="Type"
            value={qType}
            onChange={setQType}
            options={[
              { value: "", label: "Any" },
              ...Q_TYPES.map((t) => ({ value: t, label: t })),
            ]}
          />
        </CardContent>
      </Card>

      <Card className="mb-4 border-brand-special/20 bg-brand-special/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-brand-text">
            <Wand2 className="size-4 text-brand-special" aria-hidden />
            Generate (RAG → pending)
          </CardTitle>
          <CardDescription>
            Topics for grade {grade}
            {topics.length ? ` · ${topics.length} available` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 space-y-1">
            <label className="text-xs font-medium text-brand-text/60">
              Topic ID
            </label>
            {topics.length > 0 ? (
              <select
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                className="h-9 w-full rounded-lg border border-brand-surface bg-white px-2 text-sm"
              >
                {topics.map((t) => (
                  <option key={t.topic_id} value={t.topic_id}>
                    {t.name ?? t.topic_id}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="topic_id"
                className="h-9 border-brand-surface"
              />
            )}
          </div>
          <FilterSelect
            label="DOK"
            value={genDok}
            onChange={setGenDok}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
          />
          <FilterSelect
            label="Type"
            value={genType}
            onChange={(v) => setGenType(v as QuestionType)}
            options={Q_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <div className="space-y-1">
            <label className="text-xs font-medium text-brand-text/60">
              Count
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value) || 1)}
              className="h-9 w-20 border-brand-surface"
            />
          </div>
          <Button
            disabled={generating}
            onClick={() => void handleGenerate()}
            className="bg-brand-special text-white hover:bg-brand-special/90"
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Wand2 className="size-4" aria-hidden />
            )}
            Generate
          </Button>
        </CardContent>
      </Card>

      {message ? (
        <p className="mb-3 rounded-lg border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-2 text-sm text-brand-text">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.length === 0 ? (
            <Card className="border-brand-surface bg-white">
              <CardContent className="py-10 text-center text-sm text-brand-text/60">
                No questions match these filters.
              </CardContent>
            </Card>
          ) : null}
          {questions.map((q) => (
            <li key={q.id}>
              <Card className="border-brand-surface bg-white">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge className="bg-brand-primary/10 text-brand-primary">
                          {q.question_type}
                        </Badge>
                        {q.dok_level != null ? (
                          <Badge variant="outline">DOK {q.dok_level}</Badge>
                        ) : null}
                        <Badge variant="outline">{q.status}</Badge>
                        {q.rejection_confirmed_ai ? (
                          <Badge className="bg-brand-accent/15 text-brand-accent">
                            AI confirmed error
                          </Badge>
                        ) : null}
                      </div>
                      <CardTitle className="text-base font-medium leading-snug text-brand-text">
                        {q.prompt}
                      </CardTitle>
                      {q.options ? (
                        <ul className="mt-2 space-y-1 text-sm text-brand-text/75">
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
                        <p className="mt-2 text-sm whitespace-pre-wrap text-brand-text/70">
                          {q.paragraph}
                        </p>
                      ) : null}
                    </div>
                    {q.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === q.id}
                          onClick={() => void handleApprove(q)}
                          className="bg-brand-secondary text-brand-text hover:bg-brand-secondary/90"
                        >
                          <Check className="size-3.5" aria-hidden />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === q.id}
                          onClick={() => {
                            setRejectTarget(q);
                            setRejectReason("FACTUAL_ERROR");
                            setRejectOpen(true);
                          }}
                          className="border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10"
                        >
                          <X className="size-3.5" aria-hidden />
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardHeader>
                {q.expected_answer ? (
                  <CardContent className="text-xs text-brand-text/55">
                    Expected: {q.expected_answer}
                  </CardContent>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject question</DialogTitle>
            <DialogDescription>
              Choose a reason. <strong>FACTUAL_ERROR</strong> may trigger AI
              confirmation on the backend.
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add custom question</DialogTitle>
            <DialogDescription>
              Posts to <code>/api/v1/teacher/questions</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <FilterSelect
              label="Type"
              value={addType}
              onChange={(v) => setAddType(v as QuestionType)}
              options={Q_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-brand-text/60">
                Prompt
              </label>
              <textarea
                value={addPrompt}
                onChange={(e) => setAddPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-brand-surface bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-brand-text/60">
                Expected answer
              </label>
              <Input
                value={addAnswer}
                onChange={(e) => setAddAnswer(e.target.value)}
                className="border-brand-surface"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={adding}
              onClick={() => void handleAdd()}
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              {adding ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AssessmentShell>
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
    <div className="space-y-1">
      <label className="text-xs font-medium text-brand-text/60">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-brand-surface bg-white px-2 text-sm text-brand-text"
      >
        {options.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
