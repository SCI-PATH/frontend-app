"use client";

import { useEffect, useState } from "react";

import {
  approveTeacherQuestion,
  holdTeacherQuestion,
  rejectTeacherQuestion,
} from "../../api/teacher";
import type {
  MostMissedQuestionInsight,
  RejectReason,
  TeacherQuestion,
} from "../../types";
import { AssessmentApiError } from "../../types";

import type { StatusConfirmKind } from "./bankUi";
import { toTeacherQuestion } from "./bankUi";

export function useQuestionBankModeration(reload: () => Promise<void>) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TeacherQuestion | null>(
    null
  );
  const [rejectReason, setRejectReason] =
    useState<RejectReason>("FACTUAL_ERROR");
  const [rejectNotes, setRejectNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{
    kind: StatusConfirmKind;
    question: TeacherQuestion;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  function openReject(
    q: TeacherQuestion | MostMissedQuestionInsight,
    fromList: TeacherQuestion[] = []
  ) {
    setRejectTarget(toTeacherQuestion(q, fromList));
    setRejectReason("FACTUAL_ERROR");
    setRejectNotes("");
    setRejectOpen(true);
  }

  function requestApprove(question: TeacherQuestion) {
    setStatusConfirm({ kind: "approve", question });
  }

  function requestHold(question: TeacherQuestion) {
    setStatusConfirm({ kind: "hold", question });
  }

  async function handleStatusConfirm() {
    if (!statusConfirm) return;
    const q = statusConfirm.question;
    setBusyId(q.id);
    setError(null);
    try {
      if (statusConfirm.kind === "approve") {
        await approveTeacherQuestion(q.id);
        setToast(
          q.status === "rejected"
            ? "Approved again. Students can receive this question. Nothing was deleted."
            : "Approved. Students can receive this question. Nothing was deleted."
        );
      } else {
        await holdTeacherQuestion(q.id);
        setToast(
          "Held as pending. Students will not see it until you approve. Nothing was deleted."
        );
      }
      setStatusConfirm(null);
      await reload();
    } catch (err) {
      if (
        err instanceof AssessmentApiError &&
        err.status === 404 &&
        statusConfirm.kind === "hold"
      ) {
        setError(
          "Hold is not available on this API yet. Approve and reject still work. Nothing was deleted."
        );
      } else {
        setError(
          err instanceof AssessmentApiError
            ? err.message
            : "Could not update status"
        );
      }
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
      setToast("Rejected. The question stays in the bank — it is not deleted.");
      await reload();
    } catch (err) {
      setError(
        err instanceof AssessmentApiError ? err.message : "Reject failed"
      );
    } finally {
      setBusyId(null);
    }
  }

  return {
    busyId,
    error,
    setError,
    toast,
    setToast,
    openReject,
    requestApprove,
    requestHold,
    dialogs: {
      rejectOpen,
      onRejectOpenChange: setRejectOpen,
      rejectTarget,
      rejectReason,
      onRejectReasonChange: setRejectReason,
      rejectNotes,
      onRejectNotesChange: setRejectNotes,
      onRejectConfirm: () => void handleRejectConfirm(),
      statusConfirm,
      onStatusConfirmChange: setStatusConfirm,
      onStatusConfirm: () => void handleStatusConfirm(),
      busyId,
    },
  };
}
