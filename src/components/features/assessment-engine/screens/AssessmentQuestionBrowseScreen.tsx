"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { EducatorNavbar } from "@/components/common/educator-home/EducatorNavbar";
import { Button } from "@/components/ui/button";

import {
  fetchMostMissedQuestions,
  fetchTeacherQuestions,
  fetchTeacherQuestionsAllGrades,
  fetchTeacherQuestionsAllStatuses,
  fetchTeacherQuestionsAllStatusesAndGrades,
  fetchTeacherTopics,
  fetchTeacherTopicsAllGrades,
} from "../api/teacher";
import { AssessmentShell } from "../components/AssessmentShell";
import {
  FilterToolbar,
  QuestionBankActionDialogs,
  QuestionBankPageHeader,
  QuestionBankGradeFilter,
  QuestionCard,
  QuestionListHeader,
  toTeacherQuestion,
} from "../components/question-bank/bankUi";
import { useQuestionBankModeration } from "../components/question-bank/useQuestionBankModeration";
import { useQuestionBankGrade } from "../components/question-bank/useQuestionBankGrade";
import { useAssessmentUser } from "../store/useAssessmentUser";
import type {
  MostMissedQuestionInsight,
  TeacherQuestion,
  TeacherTopic,
} from "../types";
import { AssessmentApiError } from "../types";
import {
  chapterIdFromTopicId,
  chaptersFromTopics,
} from "../utils/topicChapter";

type StatusFilter = "pending" | "approved" | "rejected" | "all";
type BankView = "bank" | "missed";

const PAGE_SIZE = 12;

export function AssessmentQuestionBrowseScreen() {
  const user = useAssessmentUser();
  const [bootGrade] = useQuestionBankGrade();
  const [filterGrade, setFilterGrade] =
    useState<QuestionBankGradeFilter>(bootGrade);
  const [status, setStatus] = useState<StatusFilter>("approved");
  const [chapterId, setChapterId] = useState("");
  const [view, setView] = useState<BankView>("bank");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [topics, setTopics] = useState<TeacherTopic[]>([]);
  const [mostMissed, setMostMissed] = useState<MostMissedQuestionInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const reloadRef = useRef<() => Promise<void>>(async () => {});
  const moderation = useQuestionBankModeration(() => reloadRef.current());
  const { setError } = moderation;

  const chapterOptions = useMemo(() => chaptersFromTopics(topics), [topics]);

  const loadTopics = useCallback(async () => {
    try {
      const list =
        filterGrade === "all"
          ? await fetchTeacherTopicsAllGrades()
          : await fetchTeacherTopics(filterGrade);
      setTopics(list);
    } catch {
      setTopics([]);
    }
  }, [filterGrade]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (status === "all") {
        const listQuery = {
          topic_id_prefix: chapterId ? chapterId.toUpperCase() : undefined,
          q: search.trim() || undefined,
          offset: 0,
          limit: 100,
        };
        const result =
          filterGrade === "all"
            ? await fetchTeacherQuestionsAllStatusesAndGrades(listQuery)
            : await fetchTeacherQuestionsAllStatuses({
                grade: filterGrade,
                ...listQuery,
              });
        const needle = search.trim().toLowerCase();
        const chapter = chapterId.toUpperCase();
        const filtered = result.questions.filter((q) => {
          if (
            chapter &&
            chapterIdFromTopicId(q.topic_id) !== chapter
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
        const start = Math.max(0, (page - 1) * PAGE_SIZE);
        setQuestions(filtered.slice(start, start + PAGE_SIZE));
        setTotal(filtered.length);
      } else if (filterGrade === "all") {
        const result = await fetchTeacherQuestionsAllGrades({
          status,
          topic_id_prefix: chapterId ? chapterId.toUpperCase() : undefined,
          q: search.trim() || undefined,
          offset: 0,
          limit: 100,
        });
        const needle = search.trim().toLowerCase();
        const chapter = chapterId.toUpperCase();
        const filtered = result.questions.filter((q) => {
          if (chapter && chapterIdFromTopicId(q.topic_id) !== chapter) {
            return false;
          }
          if (!needle) return true;
          const hay = [q.prompt, q.expected_answer, q.topic_id, q.chapter_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(needle);
        });
        const start = Math.max(0, (page - 1) * PAGE_SIZE);
        setQuestions(filtered.slice(start, start + PAGE_SIZE));
        setTotal(filtered.length);
      } else {
        const result = await fetchTeacherQuestions({
          grade: filterGrade,
          status,
          topic_id_prefix: chapterId ? chapterId.toUpperCase() : undefined,
          q: search.trim() || undefined,
          offset: Math.max(0, (page - 1) * PAGE_SIZE),
          limit: PAGE_SIZE,
        });
        setQuestions(result.questions);
        setTotal(result.total);
      }
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not load questions"
      );
    } finally {
      setLoading(false);
    }
  }, [filterGrade, status, chapterId, search, page, setError]);

  const loadMostMissed = useCallback(async () => {
    try {
      const rows = await fetchMostMissedQuestions({
        grade: filterGrade === "all" ? undefined : filterGrade,
        limit: 20,
      });
      setMostMissed(rows);
    } catch {
      setMostMissed([]);
    }
  }, [filterGrade]);

  reloadRef.current = async () => {
    await load();
    await loadMostMissed();
  };

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, filterGrade, chapterId, search, view]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadMostMissed();
  }, [loadMostMissed]);

  const visibleMissed = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return mostMissed.filter((row) => {
      if (
        chapterId &&
        chapterIdFromTopicId(row.topic_id) !== chapterId.toUpperCase()
      ) {
        return false;
      }
      if (!needle) return true;
      const hay = [
        row.prompt,
        row.correct_answer,
        row.most_selected?.answer,
        row.topic_id,
        row.chapter_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [mostMissed, chapterId, search]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  if (user.role !== "educator") {
    return (
      <>
        <EducatorNavbar />
        <AssessmentShell
          title="Browse bank"
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
        title="Browse bank"
        subtitle="Shared catalog and most-missed items."
        maxWidth="5xl"
        hideHeader
        actions={null}
      >
        <div className="space-y-5">
          <QuestionBankPageHeader
            current="browse"
            onRefresh={() => void reloadRef.current()}
          />

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
            searchPlaceholder={
              view === "missed"
                ? "Search most-missed items…"
                : "Search the shared bank…"
            }
            grade={filterGrade}
            onGrade={setFilterGrade}
            status={view === "bank" ? status : undefined}
            onStatus={
              view === "bank"
                ? (v) => setStatus(v as StatusFilter)
                : undefined
            }
            chapterId={chapterId}
            onChapter={setChapterId}
            chapterOptions={chapterOptions.map((c) => ({
              value: c.id,
              label: c.label,
            }))}
            view={view}
            onViewChange={setView}
          />

          <section className="space-y-3">
            <QuestionListHeader
              title={view === "missed" ? "Most missed" : "All questions"}
              countLabel={
                view === "missed"
                  ? visibleMissed.length
                    ? `${visibleMissed.length}`
                    : "0"
                  : loading
                    ? "Loading…"
                    : total === 0
                      ? "0"
                      : `${rangeStart}–${rangeEnd} of ${total}`
              }
            />

            {view === "missed" ? (
              visibleMissed.length === 0 ? (
                <div className="rounded-[1.75rem] border border-brand-surface bg-white px-6 py-12 text-center text-sm text-brand-text/60">
                  No missed questions match these filters yet. After students take
                  quizzes, the items they get wrong most often appear here.
                </div>
              ) : (
                <ul className="space-y-3">
                  {visibleMissed.map((row) => {
                    const question = toTeacherQuestion(row, questions);
                    return (
                      <li key={row.question_id}>
                        <QuestionCard
                          question={question}
                          insight={row}
                          busyId={moderation.busyId}
                          onApprove={() =>
                            moderation.requestApprove(question)
                          }
                          onHold={() => moderation.requestHold(question)}
                          onReject={() =>
                            moderation.openReject(row, questions)
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )
            ) : loading ? (
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
                    <QuestionCard
                      question={q}
                      busyId={moderation.busyId}
                      onApprove={() => moderation.requestApprove(q)}
                      onHold={() => moderation.requestHold(q)}
                      onReject={() => moderation.openReject(q, questions)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {view === "bank" && total > PAGE_SIZE ? (
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
      </AssessmentShell>
    </>
  );
}
