import { useEffect, useState } from "react";
import { getArVisualMedia } from "../arVisuals.js";

/**
 * Prefer lesson-stored image_url from DB; fall back to local category photo.
 */
export default function ArSceneVisual({ visual, label, imageUrl, imageCredit }) {
  const fallback = getArVisualMedia(visual);
  const src = (imageUrl || "").trim() || fallback.src;
  const credit = (imageCredit || "").trim() || fallback.credit;
  const [failed, setFailed] = useState(false);
  const [activeSrc, setActiveSrc] = useState(src);

  useEffect(() => {
    setFailed(false);
    setActiveSrc(src);
  }, [src]);

  function onError() {
    if (activeSrc !== fallback.src) {
      setActiveSrc(fallback.src);
      return;
    }
    setFailed(true);
  }

  return (
    <figure className="ar-photo">
      {!failed ? (
        <img
          key={activeSrc}
          className="ar-photo__img"
          src={activeSrc}
          alt={label || fallback.alt || "Lesson visual"}
          loading="eager"
          decoding="async"
          onError={onError}
        />
      ) : (
        <div className="ar-photo__fallback" aria-hidden>
          {label || "Science"}
        </div>
      )}
      <div className="ar-photo__shade" />
      <figcaption className="ar-photo__credit">{credit}</figcaption>
    </figure>
  );
}
