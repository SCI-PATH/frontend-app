"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, GalleryHorizontal, Map, PlayCircle, Link2 } from "lucide-react";
import { getLessonAr, getLessonMedia } from "../api/client.js";
import { resolveMediaUrl } from "../utils/resolveMediaUrl.js";
import ScienceExplorer from "./ScienceExplorer.jsx";
import LessonVideoLibrary from "./LessonVideoLibrary.jsx";

/**
 * Explore tab — video library, additional material, gallery, and map.
 */
export default function LessonVisualExplore({ lessonId, lessonTitle, topicId }) {
  const [tab, setTab] = useState("videos");
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
    for (const image of media?.gallery_images || []) {
      if (!image?.image_url) continue;
      items.push({
        url: resolveMediaUrl(image.image_url),
        title: image.caption || "Chapter image",
        caption: image.caption || "",
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

  const materials = media?.additional_materials || [];

  return (
    <div className="lesson-explore-panel">
      <div className="lesson-explore-panel__tabs" role="tablist" aria-label="Explore resources">
        <ExploreTab active={tab === "videos"} onClick={() => setTab("videos")} icon={PlayCircle}>
          Video library
        </ExploreTab>
        <ExploreTab active={tab === "materials"} onClick={() => setTab("materials")} icon={Link2}>
          Additional material
        </ExploreTab>
        <ExploreTab active={tab === "gallery"} onClick={() => setTab("gallery")} icon={GalleryHorizontal}>
          Image gallery
        </ExploreTab>
        <ExploreTab active={tab === "map"} onClick={() => setTab("map")} icon={Map}>
          Interactive map
        </ExploreTab>
      </div>

      <div className="lesson-explore-panel__content">
        {tab === "videos" ? (
          <LessonVideoLibrary lessonId={lessonId} lessonTitle={lessonTitle} />
        ) : null}

        {tab === "materials" ? (
          materials.length ? (
            <ul className="lesson-materials-list">
              {materials.map((item, index) => (
                <li key={`${item.url}-${index}`}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} aria-hidden />
                    <span>
                      <strong>{item.title || `Resource ${index + 1}`}</strong>
                      <small>{item.url}</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <ExploreEmpty
              title="No additional material yet"
              text="Your teacher can add links to websites, articles, or reference pages."
            />
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
            <ExploreEmpty title="Gallery coming soon" text="Approved lesson images will appear here." />
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
