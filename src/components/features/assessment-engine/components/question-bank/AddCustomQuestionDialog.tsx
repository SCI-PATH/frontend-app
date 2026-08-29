"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

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
import { createTeacherQuestion } from "../../api/teacher";
import type {
  CreateTeacherQuestionRequest,
  QuestionType,
  TeacherQuestion,
  TeacherTopic,
  TeacherQuestionPayload,
} from "../../types";
import { AssessmentApiError } from "../../types";
import {
  chapterIdFromTopicId,
  topicsForChapter,
} from "../../utils/topicChapter";
import { ChipRow } from "./bankUi";
import { cn } from "@/lib/utils";

const Q_TYPES: QuestionType[] = [
  "MCQ",
  "TrueFalse",
  "ShortAnswer",
  "MultiBlank",
];

const MCQ_KEYS = ["A", "B", "C", "D"] as const;

interface AddCustomQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: number;
  onGradeChange?: (grade: number) => void;
  topics: TeacherTopic[];
  defaultChapterId?: string;
  defaultTopicId?: string;
  defaultDok?: number;
  defaultType?: QuestionType;
  onCreated: (question: TeacherQuestion) => void;
}

export function AddCustomQuestionDialog({
  open,
  onOpenChange,
  grade,
  onGradeChange,
  topics,
  defaultChapterId = "",
  defaultTopicId = "",
  defaultDok = 2,
  defaultType = "MCQ",
  onCreated,
}: AddCustomQuestionDialogProps) {
  const chapters = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of topics) {
      const id = chapterIdFromTopicId(t.topic_id);
      if (id && !map.has(id)) {
        map.set(id, t.chapter_title ? `${id} · ${t.chapter_title}` : id);
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [topics]);

  const [chapterId, setChapterId] = useState(defaultChapterId);
  const [topicId, setTopicId] = useState("");
  const [dok, setDok] = useState(String(defaultDok));
  const [qType, setQType] = useState<QuestionType>("MCQ");

  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<Record<string, string>>({
    A: "",
    B: "",
    C: "",
    D: "",
  });
  const [correctLetter, setCorrectLetter] = useState("A");
  const [tfAnswer, setTfAnswer] = useState<"True" | "False">("True");
  const [shortAnswer, setShortAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [blanks, setBlanks] = useState(["", "", ""]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chapterTopics = useMemo(
    () => topicsForChapter(topics, chapterId),
    [topics, chapterId]
  );

  useEffect(() => {
    if (!open) return;
    setChapterId(defaultChapterId || chapters[0]?.id || "");
    setTopicId(defaultTopicId || "");
    setDok(String(defaultDok || 2));
    setQType(defaultType);
    setError(null);
  }, [
    open,
    defaultChapterId,
    defaultTopicId,
    defaultDok,
    defaultType,
    chapters,
  ]);

  useEffect(() => {
    if (!chapterTopics.length) {
      setTopicId("");
      return;
    }
    if (!chapterTopics.some((t) => t.topic_id === topicId)) {
      setTopicId(chapterTopics[0].topic_id);
    }
  }, [chapterTopics, topicId]);

  const selectedTopic = chapterTopics.find((t) => t.topic_id === topicId);

  function buildPayload(): TeacherQuestionPayload | null {
    if (qType === "MCQ") {
      const cleaned: Record<string, string> = {};
      for (const key of MCQ_KEYS) {
        const text = options[key]?.trim();
        if (text) cleaned[key] = text;
      }
      if (!prompt.trim() || Object.keys(cleaned).length < 2) return null;
      if (!cleaned[correctLetter]) return null;
      return {
        type: "MCQ",
        question: prompt.trim(),
        options: cleaned,
        correct_answer: correctLetter,
      };
    }
    if (qType === "TrueFalse") {
      if (!prompt.trim()) return null;
      return {
        type: "TrueFalse",
        question: prompt.trim(),
        correct_answer: tfAnswer,
        distractor_tag: "MISCONCEPTION",
        distractor_label: `Selected ${tfAnswer === "True" ? "False" : "True"} instead of ${tfAnswer}`,
      };
    }
    if (qType === "ShortAnswer") {
      if (!prompt.trim() || !shortAnswer.trim()) return null;
      const kw = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      return {
        type: "ShortAnswer",
        question: prompt.trim(),
        ideal_answer: shortAnswer.trim(),
        keywords: kw.length ? kw : [shortAnswer.trim().split(/\s+/)[0]].filter(Boolean),
      };
    }
    // MultiBlank
    const answers = blanks.map((b) => b.trim()).filter(Boolean);
    if (!prompt.trim() || answers.length < 1) return null;
    return {
      type: "MultiBlank",
      paragraph: prompt.trim(),
      answers,
    };
  }

  async function handleSave() {
    const payload = buildPayload();
    if (!payload || !topicId) {
      setError("Complete all required fields and select a topic.");
      return;
    }
    const topic = selectedTopic;
    const body: CreateTeacherQuestionRequest = {
      grade,
      chapter_name: topic?.chapter_title || chapterId || "Science",
      topic_id: topicId,
      skill: topic?.skill || topic?.name || topicId,
      dok_level: Number(dok) || 2,
      question_type: qType,
      payload,
      sub_concept: topic?.skill || "",
    };
    setSaving(true);
    setError(null);
    try {
      const created = await createTeacherQuestion(body);
      onOpenChange(false);
      resetForm();
      onCreated(created);
    } catch (err) {
      setError(
        err instanceof AssessmentApiError ? err.message : "Could not save question"
      );
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setPrompt("");
    setOptions({ A: "", B: "", C: "", D: "" });
    setCorrectLetter("A");
    setTfAnswer("True");
    setShortAnswer("");
    setKeywords("");
    setBlanks(["", "", ""]);
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a question for students</DialogTitle>
          <DialogDescription>
            Write an item for every student on SCI-PATH. It is saved as{" "}
            <strong>approved</strong> and can appear in their quizzes right
            away — not limited to one class.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {onGradeChange ? (
            <ChipRow
              label="Grade"
              value={String(grade)}
              onChange={(v) => onGradeChange(Number(v))}
              options={[6, 7, 8, 9].map((g) => ({
                value: String(g),
                label: `Grade ${g}`,
              }))}
            />
          ) : (
            <p className="text-sm text-brand-text/70">
              Grade <span className="font-semibold text-brand-text">{grade}</span>
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldSelect
              label="Chapter"
              value={chapterId}
              onChange={setChapterId}
              options={chapters.map((c) => ({ value: c.id, label: c.label }))}
            />
            <FieldSelect
              label="Topic"
              value={topicId}
              onChange={setTopicId}
              options={chapterTopics.map((t) => ({
                value: t.topic_id,
                label: t.skill || t.name || t.topic_id,
              }))}
            />
            <FieldSelect
              label="DOK"
              value={dok}
              onChange={setDok}
              options={[1, 2, 3, 4].map((d) => ({
                value: String(d),
                label: `DOK ${d}`,
              }))}
            />
            <FieldSelect
              label="Question type"
              value={qType}
              onChange={(v) => setQType(v as QuestionType)}
              options={Q_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
              {qType === "MultiBlank" ? "Paragraph (use ___ for blanks)" : "Question"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={qType === "MultiBlank" ? 4 : 3}
              className="w-full rounded-xl border border-brand-surface bg-white px-3 py-2 text-sm text-brand-text"
              placeholder={
                qType === "MultiBlank"
                  ? "Water freezes at ___ °C and boils at ___ °C."
                  : "Write the question stem…"
              }
            />
          </div>

          {qType === "MCQ" ? (
            <div className="space-y-3 rounded-2xl border border-brand-surface bg-brand-background/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
                Choices
              </p>
              {MCQ_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectLetter(key)}
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors",
                      correctLetter === key
                        ? "bg-brand-secondary text-brand-text ring-2 ring-brand-secondary/40"
                        : "bg-white text-brand-text/60 ring-1 ring-brand-surface"
                    )}
                    title="Mark as correct"
                  >
                    {key}
                  </button>
                  <Input
                    value={options[key]}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={`Option ${key}`}
                    className="border-brand-surface"
                  />
                </div>
              ))}
              <p className="text-xs text-brand-text/50">
                Tap a letter to mark the correct answer (currently {correctLetter}).
              </p>
            </div>
          ) : null}

          {qType === "TrueFalse" ? (
            <div className="flex gap-2">
              {(["True", "False"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTfAnswer(val)}
                  className={cn(
                    "flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
                    tfAnswer === val
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary ring-2 ring-brand-primary/25"
                      : "border-brand-surface bg-white text-brand-text/70"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          ) : null}

          {qType === "ShortAnswer" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
                  Ideal answer
                </label>
                <Input
                  value={shortAnswer}
                  onChange={(e) => setShortAnswer(e.target.value)}
                  className="border-brand-surface"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
                  Keywords (comma-separated)
                </label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="pole, attract, north"
                  className="border-brand-surface"
                />
              </div>
            </div>
          ) : null}

          {qType === "MultiBlank" ? (
            <div className="space-y-2 rounded-2xl border border-brand-surface bg-brand-background/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
                Expected blank answers (in order)
              </p>
              {blanks.map((blank, idx) => (
                <Input
                  key={idx}
                  value={blank}
                  onChange={(e) => {
                    const next = [...blanks];
                    next[idx] = e.target.value;
                    setBlanks(next);
                  }}
                  placeholder={`Blank ${idx + 1}`}
                  className="border-brand-surface"
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBlanks((b) => [...b, ""])}
                className="border-brand-surface"
              >
                Add blank
              </Button>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-brand-accent/25 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={() => void handleSave()}
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldSelect({
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
          <option value="">None available</option>
        ) : (
          options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
