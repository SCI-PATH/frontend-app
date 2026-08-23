"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

/**
 * Lesson tab — sliding side panel placeholder (reserved for future features).
 */
export default function LessonSidePlaceholder({ onCollapsedChange }) {
  const [expanded, setExpanded] = useState(true);

  function toggleExpanded() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    onCollapsedChange?.(!nextExpanded);
  }

  return (
    <aside
      className={`lesson-static lesson-static--placeholder${expanded ? "" : " is-collapsed"}`}
      aria-label="Side panel"
    >
      <div className="lesson-static__header">
        <div>
          <span className="lesson-static__kicker">Coming soon</span>
          <h3 className="lesson-static__heading">Side panel</h3>
        </div>
        <button
          type="button"
          className="lesson-static__collapse-btn"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse side panel" : "Expand side panel"}
          title={expanded ? "Collapse side panel" : "Expand side panel"}
        >
          {expanded ? <ChevronRight size={17} aria-hidden /> : <ChevronLeft size={17} aria-hidden />}
          <span>{expanded ? "Close" : "Expand"}</span>
        </button>
      </div>
      {expanded ? (
        <div className="lesson-static__placeholder lesson-static__placeholder--reserved">
          <Sparkles size={28} aria-hidden />
          <p>Reserved for an upcoming feature.</p>
        </div>
      ) : (
        <button
          type="button"
          className="lesson-static__collapsed-preview"
          onClick={toggleExpanded}
          aria-label="Expand side panel"
        >
          <span className="lesson-static__collapsed-placeholder">
            <Sparkles size={30} aria-hidden />
          </span>
          <span>Side panel</span>
        </button>
      )}
    </aside>
  );
}
