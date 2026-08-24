"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ScrollText } from "lucide-react";
import { getLessonCheatsheet } from "../api/client.js";
import { downloadCheatsheetPdf } from "../utils/cheatsheetPdf.js";

/**
 * Lesson tab — static cheat sheet / short notes (one fetch per chapter; unchanged while stepping).
 */
export default function LessonCheatSheet({ lessonId, lessonTitle, onCollapsedChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!lessonId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    getLessonCheatsheet(lessonId)
      .then((payload) => {
        if (!cancelled) setData(payload?.cheatsheet || null);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setError("Could not load cheat sheet. Try again in a moment.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const sheet = data;
  const previewSection = sheet?.sections?.[0];
  const previewBullet = previewSection?.bullets?.[0] || sheet?.headline || "";

  function toggleExpanded() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    onCollapsedChange?.(!nextExpanded);
  }

  async function onDownloadPdf() {
    if (!sheet || downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadCheatsheetPdf(sheet, lessonTitle || sheet.title);
    } catch (err) {
      console.error("[LessonCheatSheet] PDF download failed", err);
      setDownloadError("Could not download the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <aside className="lesson-static lesson-static--cheatsheet" aria-busy="true">
        <p className="lesson-static__muted">Building cheat sheet…</p>
      </aside>
    );
  }

  return (
    <aside
      className={`lesson-static lesson-static--cheatsheet${expanded ? "" : " is-collapsed"}`}
      aria-label="Chapter cheat sheet"
    >
      <div className="lesson-static__header">
        <div>
          <span className="lesson-static__kicker">Revise anytime</span>
          <h3 className="lesson-static__heading">Cheat sheet</h3>
        </div>
        <button
          type="button"
          className="lesson-static__collapse-btn"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse cheat sheet" : "Expand cheat sheet"}
          title={expanded ? "Collapse cheat sheet" : "Expand cheat sheet"}
        >
          {expanded ? <ChevronRight size={17} aria-hidden /> : <ChevronLeft size={17} aria-hidden />}
          <span>{expanded ? "Close" : "Expand"}</span>
        </button>
      </div>

      {expanded ? (
        <div className="lesson-static__cheatsheet-body" ref={sheetRef}>
          {error ? (
            <div className="lesson-static__placeholder">
              <p>{error}</p>
            </div>
          ) : sheet ? (
            <>
              <div className="lesson-static__cheatsheet-intro">
                <h4>{sheet.title || lessonTitle || "Chapter notes"}</h4>
                {sheet.headline ? <p>{sheet.headline}</p> : null}
              </div>

              <div className="lesson-static__cheatsheet-scroll">
                {(sheet.sections || []).map((sec) => (
                  <section key={sec.heading} className="lesson-static__cheatsheet-section">
                    <h5>{sec.heading}</h5>
                    <ul>
                      {(sec.bullets || []).map((bullet) => (
                        <li key={`${sec.heading}-${bullet}`}>{bullet}</li>
                      ))}
                    </ul>
                  </section>
                ))}

                {sheet.terms?.length ? (
                  <section className="lesson-static__cheatsheet-section lesson-static__cheatsheet-terms">
                    <h5>Key terms</h5>
                    <dl>
                      {sheet.terms.map((item) => (
                        <div key={item.term} className="lesson-static__cheatsheet-term">
                          <dt>{item.term}</dt>
                          <dd>{item.definition}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ) : null}
              </div>

              <button
                type="button"
                className="lesson-static__cheatsheet-download"
                onClick={() => void onDownloadPdf()}
                disabled={downloading}
              >
                <Download size={16} aria-hidden />
                {downloading ? "Preparing PDF…" : "Download PDF"}
              </button>
              {downloadError ? (
                <p className="lesson-static__muted" role="alert">
                  {downloadError}
                </p>
              ) : null}
            </>
          ) : (
            <div className="lesson-static__placeholder">
              <p>No cheat sheet available for this chapter yet.</p>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="lesson-static__collapsed-preview lesson-static__collapsed-preview--cheatsheet"
          onClick={toggleExpanded}
          aria-label="Expand cheat sheet"
        >
          <span className="lesson-static__cheatsheet-thumb" aria-hidden>
            <ScrollText size={28} strokeWidth={2} />
            {previewSection?.heading ? (
              <small>{previewSection.heading}</small>
            ) : null}
          </span>
          <span className="lesson-static__cheatsheet-thumb-caption">
            <strong>Cheat sheet</strong>
            <small>{previewBullet ? truncate(previewBullet, 72) : "Tap to open notes"}</small>
          </span>
        </button>
      )}
    </aside>
  );
}

function truncate(text, max) {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
