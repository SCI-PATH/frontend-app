"use client";

import { useMemo } from "react";

import type { BktParameterRow, ClassroomTopicMeta } from "@/types/educator";

interface CurriculumReferenceProps {
  topics: readonly ClassroomTopicMeta[];
  profileParameters?: BktParameterRow[];
  /** When true, renders table only (parent provides collapsible chrome). */
  embedded?: boolean;
}

export function CurriculumReference({
  topics,
  profileParameters,
  embedded = false,
}: CurriculumReferenceProps) {
  const rows = useMemo(() => {
    const paramMap = new Map(
      (profileParameters ?? []).map((row) => [row.topic_id, row])
    );

    return topics.map((topic) => {
      const live = paramMap.get(topic.topicId);
      return {
        topicId: topic.topicId,
        title: topic.curriculumTitle,
        pG: live?.p_g ?? topic.pG,
        pS: live?.p_s ?? topic.pS,
        pT: live?.p_t ?? live?.learn ?? topic.pT,
        pL0: live?.p_l0 ?? live?.prior ?? topic.pL0,
      };
    });
  }, [topics, profileParameters]);

  const table = (
    <div className="overflow-x-auto rounded-xl border border-brand-surface">
      <table className="min-w-full text-sm">
        <thead className="bg-brand-background text-left text-xs uppercase tracking-wide text-brand-text/55">
          <tr>
            <th className="px-4 py-3">Topic ID</th>
            <th className="px-4 py-3">Curriculum Title</th>
            <th className="px-4 py-3">P(G)</th>
            <th className="px-4 py-3">P(S)</th>
            <th className="px-4 py-3">P(T)</th>
            <th className="px-4 py-3">P(L₀)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.topicId} className="border-t border-brand-surface/80">
              <td className="px-4 py-2 font-mono text-xs font-semibold text-brand-primary">
                {row.topicId}
              </td>
              <td className="px-4 py-2 text-brand-special/90">{row.title}</td>
              <td className="px-4 py-2">{row.pG.toFixed(2)}</td>
              <td className="px-4 py-2">{row.pS.toFixed(2)}</td>
              <td className="px-4 py-2">{row.pT.toFixed(2)}</td>
              <td className="px-4 py-2">{row.pL0.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (embedded) {
    return (
      <div aria-label="Curriculum mapping and parameter reference">{table}</div>
    );
  }

  return (
    <section aria-label="Curriculum mapping and parameter reference">
      {table}
    </section>
  );
}
