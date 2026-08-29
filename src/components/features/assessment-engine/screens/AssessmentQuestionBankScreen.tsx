"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, Wand2 } from "lucide-react";

import { EducatorNavbar } from "@/components/common/educator-home/EducatorNavbar";
import { Button } from "@/components/ui/button";

import {
  fetchTeacherQuestions,
  fetchTeacherQuestionsAllGrades,
  fetchTeacherQuestionsAllStatuses,
  fetchTeacherQuestionsAllStatusesAndGrades,
  fetchTeacherTopics,
  fetchTeacherTopicsAllGrades,
  generateTeacherQuestions,
} from "../api/teacher";
import { AssessmentShell } from "../components/AssessmentShell";
import { AddCustomQuestionDialog } from "../components/question-bank/AddCustomQuestionDialog";
import {
  ChipRow,
  FilterSelect,
  FilterToolbar,
  QuestionBankActionDialogs,
  QuestionBankPageHeader,
  QuestionBankGradeFilter,
  QuestionCard,
  QuestionListHeader,
  Q_TYPES,
  isTeacherOrigin,
} from "../components/question-bank/bankUi";
import { useQuestionBankModeration } from "../components/question-bank/useQuestionBankModeration";
import { useQuestionBankGrade } from "../components/question-bank/useQuestionBankGrade";
import { useAssessmentUser } from "../store/useAssessmentUser";
import type { QuestionType, TeacherQuestion, TeacherTopic } from "../types";
import { AssessmentApiError } from "../types";
import {
  chapterIdFromTopicId,
  chaptersFromTopics,
  topicsForChapter,
} from "../utils/topicChapter";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

const PAGE_SIZE = 12;
const WORKSPACE_LIMIT = 200;

export function AssessmentQuestionBankScreen() {
  const user = useAssessmentUser();
  const [grade, setGrade] = useQuestionBankGrade();
  const [filterGrade, setFilterGrade] = useState<QuestionBankGradeFilter>(grade);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [chapterId, setChapterId] = useState("");
  const [page, setPage] = useState(1);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const sessionTeacherIds = useRef<Set<string>>(new Set());

  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [createTopics, setCreateTopics] = useState<TeacherTopic[]>([]);
  const [filterTopics, setFilterTopics] = useState<TeacherTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const skipNextAutoLoadRef = useRef(false);
  const listRef = useRef<HTMLElement>(null);

  const [genChapter, setGenChapter] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genDok, setGenDok] = useState("2");
  const [genType, setGenType] = useState<QuestionType>("MCQ");
  const [generating, setGenerating] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const reloadRef = useRef<() => Promise<void>>(async () => {});
  const moderation = useQuestionBankModeration(() => reloadRef.current());
  const { setError } = moderation;

  const load = useCallback(async (overrides?: {
    filterGrade?: QuestionBankGradeFilter;
    status?: StatusFilter;
  }) => {
    const nextFilterGrade = overrides?.filterGrade ?? filterGrade;
    const nextStatus = overrides?.status ?? status;
    setLoading(true);
    setError(null);
    try {
      const listQuery = {
        origin: "teacher" as const,
        limit: WORKSPACE_LIMIT,
        offset: 0,
      };
      const result =
        nextFilterGrade === "all"
          ? nextStatus === "all"
            ? await fetchTeacherQuestionsAllStatusesAndGrades(listQuery)
            : await fetchTeacherQuestionsAllGrades({
                ...listQuery,
                status: nextStatus,
              })
          : nextStatus === "all"
            ? await fetchTeacherQuestionsAllStatuses({
                grade: nextFilterGrade,
                ...listQuery,
              })
            : await fetchTeacherQuestions({
                grade: nextFilterGrade,
                status: nextStatus,
                ...listQuery,
              });
      const extra = sessionTeacherIds.current;
      setQuestions(
        result.questions.filter(
          (q) => isTeacherOrigin(q.origin) || extra.has(q.id)
        )
      );
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not load questions"
      );
    } finally {
      setLoading(false);
    }
  }, [filterGrade, status, setError]);

  reloadRef.current = () => load();

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, filterGrade, chapterId, search]);

  const filterChapterOptions = useMemo(
    () => chaptersFromTopics(filterTopics),
    [filterTopics]
  );
  const createChapterOptions = useMemo(
    () => chaptersFromTopics(createTopics),
    [createTopics]
  );
  const genTopics = useMemo(
    () => topicsForChapter(createTopics, genChapter),
    [createTopics, genChapter]
  );

  const loadCreateTopics = useCallback(async () => {
    try {
      const list = await fetchTeacherTopics(grade);
      setCreateTopics(list);
      const chapters = chaptersFromTopics(list);
      const firstChapter = chapters[0]?.id || "";
      setGenChapter(firstChapter);
      const firstInChapter = firstChapter
        ? topicsForChapter(list, firstChapter)[0]?.topic_id
        : list[0]?.topic_id;
      setGenTopic(firstInChapter || "");
    } catch {
      setCreateTopics([]);
      setGenChapter("");
      setGenTopic("");
    }
  }, [grade]);

  const loadFilterTopics = useCallback(async () => {
    try {
      const list =
        filterGrade === "all"
          ? await fetchTeacherTopicsAllGrades()
          : await fetchTeacherTopics(filterGrade);
      setFilterTopics(list);
    } catch {
      setFilterTopics([]);
    }
  }, [filterGrade]);

  useEffect(() => {
    void loadCreateTopics();
  }, [loadCreateTopics]);

  useEffect(() => {
    void loadFilterTopics();
  }, [loadFilterTopics]);

  useEffect(() => {
    if (!genTopics.length) return;
    if (!genTopics.some((t) => t.topic_id === genTopic)) {
      setGenTopic(genTopics[0].topic_id);
    }
  }, [genTopics, genTopic]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (
        chapterId &&
        chapterIdFromTopicId(q.topic_id) !== chapterId.toUpperCase()
      ) {
        return false;
      }
      if (!needle) return true;
      const hay = [q.prompt, q.expected_answer, q.topic_id, q.chapter_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [questions, chapterId, search]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = visible.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, visible.length);

  async function revealCreated(created: TeacherQuestion[], nextGrade?: number) {
    const items = created.map((q) => ({ ...q, origin: q.origin || "teacher" }));
    for (const item of items) sessionTeacherIds.current.add(item.id);
    skipNextAutoLoadRef.current = true;
    setStatus("all");
    setChapterId("");
    setSearchInput("");
    setSearch("");
    setPage(1);
    if (nextGrade != null) {
      setGrade(nextGrade);
      setFilterGrade(nextGrade);
    }
    setPinnedIds(items.map((q) => q.id));
    if (items.length) {
      setQuestions((prev) => {
        const ids = new Set(items.map((q) => q.id));
        return [...items, ...prev.filter((q) => !ids.has(q.id))];
      });
    }
    await load({ status: "all", filterGrade: nextGrade ?? filterGrade });
    if (items.length) {
      setQuestions((prev) => {
        const ids = new Set(items.map((q) => q.id));
        return [...items, ...prev.filter((q) => !ids.has(q.id))];
      });
    }
    window.requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  useEffect(() => {
    if (skipNextAutoLoadRef.current) {
      skipNextAutoLoadRef.current = false;
      return;
    }
    void load();
  }, [load]);

  async function handleGenerate() {
    if (!genTopic.trim()) {
      moderation.setError("Select a chapter and topic before generating.");
      return;
    }
    setGenerating(true);
    moderation.setError(null);
    moderation.setToast("Drafting a question…");
    const topicId = genTopic.trim();
    const topicMeta = createTopics.find((t) => t.topic_id === topicId);
    const nextGrade = topicMeta?.grade ?? grade;

    try {
      const result = await generateTeacherQuestions({
        topic_id: topicId,
        skill: topicMeta?.skill,
        dok_level: Number(genDok) || 2,
        question_type: genType,
        count: 1,
      });

      if (result.created === 0 || result.questions.length === 0) {
        moderation.setError(
          "No questions were created. Try again or pick another topic."
        );
        moderation.setToast(null);
        return;
      }

      moderation.setToast("Draft added below. Approve it before students see it.");
      await revealCreated(result.questions, nextGrade);
    } catch (err) {
      moderation.setToast(null);
      moderation.setError(
        err instanceof AssessmentApiError ? err.message : "Generate failed"
      );
    } finally {
      setGenerating(false);
    }
  }

  if (user.role !== "educator") {
    return (
      <>
        <EducatorNavbar />
        <AssessmentShell
          title="Question bank"
          subtitle="Educator tools"
          hideHeader
        >
          <div className="rounded-[2rem] border border-brand-surface bg-white px-6 py-12 text-center text-sm text-brand-text/70">
            Sign in with an educator account to review and manage the question
            bank.
          </div>
        </AssessmentShell>
      </>
    );
  }

  return (
    <>
      <EducatorNavbar />
      <AssessmentShell
        title="Question bank"
        subtitle="Create and manage the questions you add for SCI-PATH."
        maxWidth="5xl"
        hideHeader
        actions={null}
      >
        <div className="space-y-5">
          <QuestionBankPageHeader
            current="yours"
            onRefresh={() => void load()}
          />

          <section className="overflow-hidden rounded-3xl border border-brand-special/15 bg-gradient-to-br from-white to-brand-special/8 shadow-sm">
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
                    Create
                  </p>
                  <h2 className="text-xl font-semibold text-brand-text">
                    Add a question
                  </h2>
                  <p className="text-sm leading-snug text-brand-text/65">
                    Pick grade, chapter, and topic, then draft with AI or add
                    your own. New items appear at the top of Your questions.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  className="rounded-xl bg-brand-accent text-white hover:bg-brand-accent/90"
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add question
                </Button>
              </div>
              <ChipRow
                label="Grade"
                value={String(grade)}
                onChange={(v) => setGrade(Number(v))}
                options={[6, 7, 8, 9].map((g) => ({
                  value: String(g),
                  label: `Grade ${g}`,
                }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect
                  label="Chapter"
                  value={genChapter}
                  onChange={setGenChapter}
                  options={createChapterOptions.map((c) => ({
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
              </div>
              <ChipRow
                label="Question type"
                value={genType}
                onChange={(v) => setGenType(v as QuestionType)}
                options={Q_TYPES.map((t) => ({ value: t, label: t }))}
              />
              <ChipRow
                label="Level"
                value={genDok}
                onChange={setGenDok}
                options={[1, 2, 3, 4].map((d) => ({
                  value: String(d),
                  label: `DOK ${d}`,
                }))}
              />
              <Button
                disabled={generating || !genTopic}
                onClick={() => void handleGenerate()}
                className="h-10 rounded-xl bg-brand-special text-white hover:bg-brand-special/90"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Wand2 className="size-4" aria-hidden />
                )}
                {generating ? "Drafting…" : "Draft with AI"}
              </Button>
            </div>
          </section>

          {moderation.toast ? (
            <p className="rounded-2xl border border-brand-secondary/30 bg-brand-secondary/10 px-4 py-3 text-sm text-brand-text">
              {moderation.toast}
            </p>
          ) : null}
          {moderation.error ? (
            <p
              className="rounded-2xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent"
              role="alert"
            >
              {moderation.error}
            </p>
          ) : null}

          <FilterToolbar
            search={searchInput}
            onSearch={setSearchInput}
            searchPlaceholder="Search your questions…"
            grade={filterGrade}
            onGrade={setFilterGrade}
            status={status}
            onStatus={(v) => setStatus(v as StatusFilter)}
            chapterId={chapterId}
            onChapter={setChapterId}
            chapterOptions={filterChapterOptions.map((c) => ({
              value: c.id,
              label: c.label,
            }))}
          />

          <section ref={listRef} className="space-y-3">
            <QuestionListHeader
              title="Your questions"
              countLabel={
                loading
                  ? "Loading…"
                  : visible.length === 0
                    ? "0"
                    : `${rangeStart}–${rangeEnd} of ${visible.length}`
              }
            />

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-8 animate-spin text-brand-primary" />
              </div>
            ) : (
              <ul className="space-y-3">
                {paged.length === 0 ? (
                  <li className="rounded-[1.75rem] border border-brand-surface bg-white px-6 py-12 text-center text-sm text-brand-text/60">
                    No questions of yours match these filters. Draft with AI or
                    add a question, or open Browse bank for the shared catalog.
                  </li>
                ) : null}
                {paged.map((q) => (
                  <li key={q.id}>
                    <QuestionCard
                      question={q}
                      pinned={pinnedIds.includes(q.id)}
                      busyId={moderation.busyId}
                      onApprove={() => moderation.requestApprove(q)}
                      onHold={() => moderation.requestHold(q)}
                      onReject={() => moderation.openReject(q, questions)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {visible.length > PAGE_SIZE ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-surface bg-white px-4 py-3">
                <p className="text-xs tabular-nums text-brand-text/50">
                  Page {page} of {pageCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pageCount || loading}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    className="rounded-xl"
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <QuestionBankActionDialogs {...moderation.dialogs} />

        <AddCustomQuestionDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          grade={grade}
          onGradeChange={setGrade}
          topics={createTopics}
          defaultChapterId={genChapter || chapterId}
          defaultTopicId={genTopic}
          defaultDok={genDok ? Number(genDok) : 2}
          defaultType={genType}
          onCreated={(question) => {
            moderation.setToast("Question added. It is at the top of the list.");
            void revealCreated([question]);
          }}
        />
      </AssessmentShell>
    </>
  );
}
