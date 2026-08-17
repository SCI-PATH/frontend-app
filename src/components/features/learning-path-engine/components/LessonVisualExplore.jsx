"use client";

import { useEffect, useMemo, useState } from "react";
import { GalleryHorizontal, Map, Network } from "lucide-react";
import { getLessonAr, getLessonMedia } from "../api/client.js";
import ScienceExplorer from "./ScienceExplorer.jsx";
import MindmapGraphic from "./MindmapGraphic.jsx";

/**
 * Explore tab — full-area chapter science infographic / map only.
 */
export default function LessonVisualExplore({ lessonId, lessonTitle, topicId }) {
  const [tab, setTab] = useState("mindmap");
  const [media, setMedia] = useState(null);
  const [ar, setAr] = useState(null);
  const lessonHint = useMemo(
    () => ({
      lessonId,
      topicId,
      title: lessonTitle,
    }),
    [lessonId, topicId, lessonTitle],
  );

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    Promise.allSettled([
      getLessonMedia(lessonId, { preview: false }),
      getLessonAr(lessonId, { generate: false }),
    ]).then(([mediaResult, arResult]) => {
      if (cancelled) return;
      setMedia(mediaResult.status === "fulfilled" ? mediaResult.value : null);
      setAr(arResult.status === "fulfilled" ? arResult.value : null);
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const gallery = useMemo(() => {
    const items = [];
    if (media?.summary_image_url) {
      items.push({
        url: media.summary_image_url,
        title: media.summary?.title || "Chapter summary",
        caption: media.summary?.headline || "",
      });
    }
    for (const scene of ar?.payload?.scenes || []) {
      if (!scene?.image_url) continue;
      items.push({
        url: scene.image_url,
        title: scene.title || scene.label || "Science visual",
        caption: scene.caption || scene.description || "",
      });
    }
    return items;
  }, [ar, media]);

  return (
    <div className="lesson-explore-panel">
      <div className="lesson-explore-panel__tabs" role="tablist" aria-label="Explore resources">
        <ExploreTab active={tab === "mindmap"} onClick={() => setTab("mindmap")} icon={Network}>
          Mind map
        </ExploreTab>
        <ExploreTab active={tab === "gallery"} onClick={() => setTab("gallery")} icon={GalleryHorizontal}>
          Image gallery
        </ExploreTab>
        <ExploreTab active={tab === "map"} onClick={() => setTab("map")} icon={Map}>
          Interactive map
        </ExploreTab>
      </div>

      <div className="lesson-explore-panel__content">
        {tab === "mindmap" ? (
          media?.summary ? (
            <div className="lesson-explore-panel__mindmap">
              <MindmapGraphic summary={media.summary} title={lessonTitle || "Chapter mind map"} />
            </div>
          ) : (
            <ExploreEmpty title="Mind map coming soon" text="Your teacher can generate and approve a chapter summary." />
          )
        ) : null}

        {tab === "gallery" ? (
          gallery.length ? (
            <div className="lesson-gallery">
              {gallery.map((item, index) => (
                <figure className="lesson-gallery__card" key={`${item.url}-${index}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.title} />
                  <figcaption>
                    <strong>{item.title}</strong>
                    {item.caption ? <span>{item.caption}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <ExploreEmpty title="Gallery coming soon" text="Approved lesson diagrams will collect here." />
          )
        ) : null}

        {tab === "map" ? (
          <ScienceExplorer embedded compact lessonHint={lessonHint} title="Interactive map" />
        ) : null}
      </div>
    </div>
  );
}

function ExploreTab({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`lesson-explore-panel__tab${active ? " is-active" : ""}`}
      onClick={onClick}
    >
      <Icon size={16} aria-hidden />
      {children}
    </button>
  );
}

function ExploreEmpty({ title, text }) {
  return (
    <div className="lesson-explore-panel__empty">
      <span>✨</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
