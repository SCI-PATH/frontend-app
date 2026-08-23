"use client";

import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";
import { getLessonMedia } from "../api/client.js";

/**
 * Explore tab — chapter video library (YouTube links from teacher).
 */
export default function LessonVideoLibrary({ lessonId, lessonTitle }) {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="lesson-explore-panel__empty">
        <span>▶</span>
        <strong>Loading videos…</strong>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="lesson-explore-panel__empty">
        <span>▶</span>
        <strong>Video library</strong>
        <p>Your teacher has not added chapter videos yet.</p>
      </div>
    );
  }

  return (
    <div className="lesson-explore-video">
      {activeVideo?.embed_url ? (
        <div className="lesson-explore-video__player">
          <iframe
            className="lesson-explore-video__iframe"
            src={activeVideo.embed_url}
            title={activeVideo.title || lessonTitle || "Chapter video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
      <div className="lesson-explore-video__playlist" aria-label="Chapter videos">
        {videos.map((video, index) => (
          <button
            type="button"
            key={`${video.url || video.embed_url}-${index}`}
            className={`lesson-explore-video__item${index === activeIndex ? " is-active" : ""}`}
            onClick={() => setActiveIndex(index)}
          >
            <PlayCircle size={18} aria-hidden />
            <span>
              <strong>{video.title || `Video ${index + 1}`}</strong>
              <small>{index === activeIndex ? "Now playing" : "Tap to watch"}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
