"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, PlayCircle } from "lucide-react";
import { getLessonMedia } from "../api/client.js";

/**
 * Lesson tab — collapsible chapter video library (multiple YouTube links).
 */
export default function LessonStaticMedia({ lessonId, lessonTitle, onCollapsedChange }) {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId) return undefined;
    let cancelled = false;
    setLoading(true);
    getLessonMedia(lessonId, { preview: false })
      .then((data) => {
        if (!cancelled) setMedia(data);
      })
      .catch(() => {
        if (!cancelled) setMedia(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const videos = media?.videos?.length
    ? media.videos
    : media?.youtube_embed_url
      ? [{ title: "Chapter video", embed_url: media.youtube_embed_url }]
      : [];
  const activeVideo = videos[Math.min(activeIndex, Math.max(videos.length - 1, 0))] || null;
  const thumbnailUrl = youtubeThumbnail(activeVideo?.embed_url);

  function toggleExpanded() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    onCollapsedChange?.(!nextExpanded);
  }

  if (loading) {
    return (
      <aside className="lesson-static lesson-static--video" aria-busy="true">
        <p className="lesson-static__muted">Loading video…</p>
      </aside>
    );
  }

  return (
    <aside
      className={`lesson-static lesson-static--video${expanded ? "" : " is-collapsed"}`}
      aria-label="Chapter video"
    >
      <div className="lesson-static__header">
        <div>
          <span className="lesson-static__kicker">Watch & discover</span>
          <h3 className="lesson-static__heading">
            Video library <span>({videos.length})</span>
          </h3>
        </div>
        <button
          type="button"
          className="lesson-static__collapse-btn"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse video library sideways" : "Expand video library"}
          title={expanded ? "Collapse video library" : "Expand video library"}
        >
          {expanded ? <ChevronRight size={17} aria-hidden /> : <ChevronLeft size={17} aria-hidden />}
          <span>{expanded ? "Close" : "Expand"}</span>
        </button>
      </div>
      {expanded ? (
        <div className="lesson-static__library">
          {activeVideo?.embed_url ? (
            <div className="lesson-static__video-wrap">
              <iframe
                className="lesson-static__video"
                src={activeVideo.embed_url}
                title={activeVideo.title || lessonTitle || media?.title || "Lesson video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="lesson-static__placeholder">
              <p>Videos will appear here once your teacher adds YouTube links.</p>
            </div>
          )}
          {videos.length ? (
            <div className="lesson-static__playlist" aria-label="Chapter videos">
              {videos.map((video, index) => (
                <button
                  type="button"
                  key={`${video.url || video.embed_url}-${index}`}
                  className={`lesson-static__playlist-item${index === activeIndex ? " is-active" : ""}`}
                  onClick={() => setActiveIndex(index)}
                >
                  <span className="lesson-static__playlist-number">
                    <PlayCircle size={16} aria-hidden />
                  </span>
                  <span>
                    <strong>{video.title || `Video ${index + 1}`}</strong>
                    <small>{index === activeIndex ? "Now playing" : "Tap to watch"}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="lesson-static__collapsed-preview"
          onClick={toggleExpanded}
          aria-label="Expand video library"
        >
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" />
          ) : (
            <span className="lesson-static__collapsed-placeholder">
              <PlayCircle size={30} aria-hidden />
            </span>
          )}
          <span>{activeVideo?.title || "Open video library"}</span>
        </button>
      )}
      {expanded ? (
        <div className="lesson-static__challenge">
          <Lightbulb size={18} aria-hidden />
          <p>
            <strong>Discovery challenge:</strong> Find one detail in the video that connects to
            today&apos;s reading.
          </p>
        </div>
      ) : null}
    </aside>
  );
}

function youtubeThumbnail(embedUrl) {
  const match = String(embedUrl || "").match(/\/embed\/([^?&/]+)/);
  return match?.[1] ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : "";
}
