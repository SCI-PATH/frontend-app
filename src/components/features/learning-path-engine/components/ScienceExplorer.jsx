"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Compass,
  Focus,
  Maximize2,
  Minimize2,
  MousePointerClick,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  EXPLORE_WORLDS,
  breadcrumbFor,
  getWorldById,
  matchWorldForLesson,
} from "../explore/exploreCatalog.js";
import {
  diagramCredit,
  diagramFallbacks,
  diagramForLevel,
} from "../explore/exploreDiagrams.js";

/**
 * Google-Maps-style science explorer:
 * - pick a topic world
 * - dive through nested levels (outside → inside)
 * - drag to orbit (360-feel), wheel/buttons to “zoom intention”
 * - hotspots open deeper views
 *
 * compact: dense single-column for lesson right-panel diagram
 */
export default function ScienceExplorer({
  initialWorldId,
  lessonHint,
  embedded = false,
  compact = false,
  onClose,
  title = "Science map",
}) {
  const matched = useMemo(() => {
    if (initialWorldId) return getWorldById(initialWorldId) || EXPLORE_WORLDS[0];
    if (lessonHint) return matchWorldForLesson(lessonHint);
    return EXPLORE_WORLDS[0];
  }, [initialWorldId, lessonHint]);

  const [worldId, setWorldId] = useState(matched.id);
  const world = getWorldById(worldId) || matched;

  const [levelId, setLevelId] = useState(world.rootLevelId);
  const level = world.levels[levelId] || world.levels[world.rootLevelId];

  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(-8);
  const [zoom, setZoom] = useState(1); // local density zoom on current level
  const [imgAttempt, setImgAttempt] = useState(0);
  const dragRef = useRef(null);

  useEffect(() => {
    setWorldId(matched.id);
    setLevelId(matched.rootLevelId);
    setRotY(0);
    setRotX(-8);
    setZoom(1);
  }, [matched.id, matched.rootLevelId]);

  useEffect(() => {
    const root = world.rootLevelId;
    if (!world.levels[levelId]) {
      setLevelId(root);
    }
  }, [world, levelId]);

  const crumbs = useMemo(() => breadcrumbFor(world, levelId), [world, levelId]);
  const hotspots = level?.hotspots || [];

  const goLevel = useCallback(
    (id) => {
      if (!world.levels[id]) return;
      setLevelId(id);
      setZoom(1);
      setRotY((y) => y + 12);
    },
    [world.levels],
  );

  const goBack = useCallback(() => {
    const parent = level?.parentId;
    if (parent && world.levels[parent]) goLevel(parent);
  }, [goLevel, level?.parentId, world.levels]);

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    const target = e.target;
    if (target?.closest?.(".sci-map__hotspot")) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotY,
      rotX,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    setRotY(d.rotY + dx * 0.35);
    setRotX(Math.max(-35, Math.min(25, d.rotX - dy * 0.25)));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (e) => {
    // prevent page scroll while exploring
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => {
      const next = Math.min(1.85, Math.max(0.75, z + delta));
      // Deep zoom near a single hotspot → dive in
      if (next > 1.55 && hotspots.length === 1) {
        queueMicrotask(() => goLevel(hotspots[0].targetLevelId));
        return 1;
      }
      // Zoom out far with parent → go out
      if (next < 0.82 && level?.parentId) {
        queueMicrotask(() => goBack());
        return 1;
      }
      return next;
    });
  };

  const palette = level?.palette || "life";
  const hue = level?.hue ?? 180;
  const diagramCandidates = useMemo(() => {
    const primary = diagramForLevel(level?.id) || level?.image || null;
    const extras = diagramFallbacks(level?.id);
    return [primary, ...extras].filter(Boolean);
  }, [level?.id, level?.image]);
  const diagramSrc = diagramCandidates[imgAttempt] || null;

  useEffect(() => {
    setImgAttempt(0);
  }, [levelId, worldId]);

  return (
    <div
      className={[
        "sci-map",
        "sci-map--photo",
        embedded ? "sci-map--embedded" : "sci-map--page",
        compact ? "sci-map--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!compact ? (
        <header className="sci-map__top">
          <div className="sci-map__titles">
            <p className="sci-map__eyebrow">
              <Compass size={14} aria-hidden /> {title}
            </p>
            <h2 className="sci-map__h">{world.title}</h2>
            <p className="sci-map__sub">{world.subtitle}</p>
          </div>
          <div className="sci-map__top-actions">
            {onClose ? (
              <button type="button" className="sci-map__btn-ghost" onClick={onClose}>
                Close
              </button>
            ) : null}
          </div>
        </header>
      ) : (
        <div className="sci-map__compact-bar">
          <span className="sci-map__compact-title">
            <Compass size={14} aria-hidden /> {level?.title || world.title}
          </span>
          <span className="sci-map__scale-pill">{level?.scale || "View"}</span>
        </div>
      )}

      {!compact && (!lessonHint || !embedded) ? (
        <div className="sci-map__worlds" role="tablist" aria-label="Topic maps">
          {EXPLORE_WORLDS.map((w) => (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={w.id === worldId}
              className={w.id === worldId ? "sci-map__world is-active" : "sci-map__world"}
              style={{ "--w-accent": w.accent }}
              onClick={() => {
                setWorldId(w.id);
                setLevelId(w.rootLevelId);
                setZoom(1);
                setRotY(0);
                setRotX(-8);
              }}
            >
              <span className="sci-map__world-label">{w.title}</span>
            </button>
          ))}
        </div>
      ) : null}

      <nav className="sci-map__crumbs" aria-label="Zoom path">
        {crumbs.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={c.id === levelId ? "sci-map__crumb is-active" : "sci-map__crumb"}
            onClick={() => goLevel(c.id)}
          >
            {i > 0 ? <span className="sci-map__crumb-sep">›</span> : null}
            {c.label}
          </button>
        ))}
        {!compact ? <span className="sci-map__scale-pill">{level?.scale || "View"}</span> : null}
      </nav>

      <div className="sci-map__body">
        <div
          className={`sci-map__viewport palette-${palette}`}
          style={{ "--stage-hue": hue }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          role="application"
          aria-label="Interactive science diagram. Drag to tilt. Scroll to zoom. Click pins to go deeper."
        >
          <div
            className="sci-map__stage sci-map__stage--diagram"
            style={{
              transform: `scale(${zoom}) rotateX(${rotX * 0.35}deg) rotateY(${rotY * 0.45}deg)`,
            }}
          >
            {diagramSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="sci-map__diagram"
                src={diagramSrc}
                alt={level?.title || "Science diagram"}
                draggable={false}
                onError={() => setImgAttempt((i) => i + 1)}
              />
            ) : (
              <div className="sci-map__diagram-fallback" aria-hidden>
                <span>{level?.emoji || "🔬"}</span>
                <p>{level?.title}</p>
              </div>
            )}
            <div className="sci-map__diagram-scrim" aria-hidden />
            {!compact ? <p className="sci-map__diagram-caption">{level?.title}</p> : null}

            {hotspots.map((hs) => (
              <button
                key={hs.id}
                type="button"
                className="sci-map__hotspot sci-map__hotspot--label"
                style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                onClick={() => goLevel(hs.targetLevelId)}
                title={`Zoom into ${hs.label}`}
              >
                <span className="sci-map__pin">+</span>
                <span className="sci-map__pin-label">{hs.label}</span>
              </button>
            ))}
          </div>

          <div className="sci-map__hud">
            {compact ? (
              <div className="sci-map__hud-controls" role="toolbar" aria-label="Map controls">
                <button type="button" className="sci-map__ctrl sci-map__ctrl--hud" onClick={goBack} disabled={!level?.parentId} title="Zoom out">
                  <Minimize2 size={14} aria-hidden />
                </button>
                <button type="button" className="sci-map__ctrl sci-map__ctrl--hud" onClick={() => setZoom((z) => Math.min(1.85, z + 0.15))} title="Zoom in">
                  <ZoomIn size={14} aria-hidden />
                </button>
                <button type="button" className="sci-map__ctrl sci-map__ctrl--hud" onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))} title="Zoom out">
                  <ZoomOut size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  className="sci-map__ctrl sci-map__ctrl--hud"
                  onClick={() => {
                    setRotY(0);
                    setRotX(-8);
                    setZoom(1);
                  }}
                  title="Reset view"
                >
                  <RotateCcw size={14} aria-hidden />
                </button>
                {hotspots[0] ? (
                  <button
                    type="button"
                    className="sci-map__ctrl sci-map__ctrl--hud sci-map__ctrl--primary"
                    onClick={() => goLevel(hotspots[0].targetLevelId)}
                    title="Dive in"
                  >
                    <Maximize2 size={14} aria-hidden />
                  </button>
                ) : (
                  <button type="button" className="sci-map__ctrl sci-map__ctrl--hud" disabled title="Deepest view">
                    <Focus size={14} aria-hidden />
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="sci-map__hud-hint">
                  <MousePointerClick size={14} aria-hidden /> Drag to tilt · scroll to zoom · tap markers
                  to go inside
                </p>
                <p className="sci-map__hud-credit">{diagramCredit(level?.id)}</p>
              </>
            )}
          </div>
        </div>

        {!compact ? (
          <aside className="sci-map__panel">
            <p className="sci-map__panel-scale">{level?.scale}</p>
            <h3 className="sci-map__panel-h">{level?.title}</h3>
            <p className="sci-map__panel-blurb">{level?.blurb}</p>
            <ul className="sci-map__facts">
              {(level?.facts || []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            <div className="sci-map__controls">
              <button type="button" className="sci-map__ctrl" onClick={goBack} disabled={!level?.parentId}>
                <Minimize2 size={16} aria-hidden /> Out
              </button>
              <button
                type="button"
                className="sci-map__ctrl"
                onClick={() => setZoom((z) => Math.min(1.85, z + 0.15))}
              >
                <ZoomIn size={16} aria-hidden /> Zoom
              </button>
              <button
                type="button"
                className="sci-map__ctrl"
                onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}
              >
                <ZoomOut size={16} aria-hidden /> Zoom
              </button>
              <button
                type="button"
                className="sci-map__ctrl"
                onClick={() => {
                  setRotY(0);
                  setRotX(-8);
                  setZoom(1);
                }}
              >
                <RotateCcw size={16} aria-hidden /> Reset view
              </button>
              {hotspots[0] ? (
                <button
                  type="button"
                  className="sci-map__ctrl sci-map__ctrl--primary"
                  onClick={() => goLevel(hotspots[0].targetLevelId)}
                >
                  <Maximize2 size={16} aria-hidden /> Dive in
                </button>
              ) : (
                <button type="button" className="sci-map__ctrl" disabled>
                  <Focus size={16} aria-hidden /> Deepest view
                </button>
              )}
            </div>

            <p className="sci-map__grades">
              Grades {world.grades.join(" · ")} · labelled educational diagrams
            </p>
          </aside>
        ) : (
          <p className="sci-map__compact-blurb">{level?.blurb}</p>
        )}
      </div>
    </div>
  );
}
