"use client";

import { useEffect, useMemo, useState } from "react";
import {
  approveTeacherTopicAr,
  generateTeacherTopicAr,
  getTeacherTopicAr,
  getTeacherTopicArPacks,
} from "../api/client.js";
import ScienceExplorer from "./ScienceExplorer.jsx";

const TOPIC_KEYS = [
  "AR_PLANTS",
  "AR_HUMAN_BODY",
  "AR_ELECTRICITY",
  "AR_LIGHT_OPTICS",
  "AR_SOUND",
  "AR_MATTER",
];

/** Map teacher pack keys → interactive science map worlds. */
const TOPIC_TO_WORLD = {
  AR_PLANTS: "plants_cells",
  AR_HUMAN_BODY: "animal_cells",
  AR_ELECTRICITY: "electricity",
  AR_LIGHT_OPTICS: "light",
  AR_SOUND: "sound",
  AR_MATTER: "matter",
};

function getTitleFromPayload(payload, topicKey) {
  return (
    payload?.topic_title ||
    payload?.title ||
    topicKey?.replace(/_/g, " ").toLowerCase()
  );
}

/**
 * Teacher: optional diagram image packs (from published lessons) + live science map preview.
 * No Unity / marker AR.
 */
export default function TeacherTopicArGallery() {
  const [packs, setPacks] = useState([]);
  const [topicKey, setTopicKey] = useState(TOPIC_KEYS[0]);
  const [payload, setPayload] = useState(null);
  const [approved, setApproved] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);

  const scenes = payload?.scenes || [];
  const scene = scenes[sceneIndex] || null;
  const title = getTitleFromPayload(payload, topicKey);

  const selectedPack = useMemo(
    () => packs.find((p) => p.topic_key === topicKey),
    [packs, topicKey],
  );

  const worldId = TOPIC_TO_WORLD[topicKey] || "plants_cells";

  useEffect(() => {
    let cancelled = false;
    setLoadingPacks(true);
    getTeacherTopicArPacks()
      .then((data) => {
        if (!cancelled) setPacks(data?.items || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPacks(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!topicKey) return undefined;
    setPayload(null);
    setApproved(false);
    setSceneIndex(0);

    getTeacherTopicAr(topicKey)
      .then((data) => {
        if (cancelled) return;
        setPayload(data?.payload || null);
        setApproved(Boolean(data?.approved));
      })
      .catch(() => {
        if (!cancelled) {
          setPayload(null);
          setApproved(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [topicKey]);

  async function onGenerate() {
    if (!topicKey) return;
    setBusy(true);
    try {
      const data = await generateTeacherTopicAr(topicKey);
      setPayload(data?.payload || null);
      setApproved(Boolean(data?.approved));
      setSceneIndex(0);
    } catch (err) {
      console.warn("[topic pack generate]", err);
      alert(
        err?.message ||
          "Could not generate reference pack (image or LLM service). Map works without this.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onApprove() {
    if (!topicKey) return;
    setBusy(true);
    try {
      const data = await approveTeacherTopicAr(topicKey);
      setPayload(data?.payload || null);
      setApproved(Boolean(data?.approved));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card teacher-topic-ar">
      <h2 className="card__h">Science map</h2>
      <p className="hint">
        Preview the student map (drag to rotate, scroll to zoom, pins to go deeper). Optional
        cartoon reference images are separate and not required.
      </p>

      <div className="teacher-topic-ar__filters">
        <label htmlFor="topicKey">
          Topic
          <select
            id="topicKey"
            value={topicKey}
            onChange={(e) => setTopicKey(e.target.value)}
          >
            {TOPIC_KEYS.map((k) => {
              const label =
                packs.find((p) => p.topic_key === k)?.title ||
                getTitleFromPayload(selectedPack, k);
              return (
                <option key={k} value={k}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      <div className="teacher-topic-ar__map">
        <ScienceExplorer embedded initialWorldId={worldId} title={`Map · ${title || topicKey}`} />
      </div>

      <details className="teacher-topic-ar__optional">
        <summary>Optional: reference cartoon pack</summary>
        <p className="hint">
          Only if you want generated images from lesson text. Map works without this. Packs can fail
          if the image service is down.
        </p>
        <span className="teacher-topic-ar__status">
          {loadingPacks
            ? "Loading…"
            : approved
              ? "Reference pack approved"
              : payload
                ? "Generated (not approved)"
                : "No reference pack"}
        </span>
        <div className="teacher-topic-ar__actions">
          <button type="button" disabled={busy || !topicKey} onClick={() => void onGenerate()}>
            {busy ? "Working…" : "Generate reference images"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy || !payload || approved}
            onClick={() => void onApprove()}
          >
            {busy ? "Working…" : "Approve references"}
          </button>
        </div>
        {payload ? (
          <div className="teacher-topic-ar__gallery">
            {scenes.map((s, idx) => (
              <button
                key={`${s?.id || s?.label || idx}-${idx}`}
                type="button"
                className={
                  idx === sceneIndex
                    ? "teacher-topic-ar__thumb teacher-topic-ar__thumb--active"
                    : "teacher-topic-ar__thumb"
                }
                onClick={() => setSceneIndex(idx)}
                title={s?.label || `Scene ${idx + 1}`}
              >
                {s?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image_url}
                    alt={s?.label || `Scene ${idx + 1}`}
                    className="teacher-topic-ar__thumb-img"
                  />
                ) : (
                  <span className="teacher-topic-ar__thumb-label only">{s?.label || "Scene"}</span>
                )}
                <span className="teacher-topic-ar__thumb-label">{s?.label}</span>
              </button>
            ))}
            {scene?.facts?.length ? (
              <ul className="small" style={{ gridColumn: "1 / -1" }}>
                {(scene.facts || []).slice(0, 4).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </details>
    </div>
  );
}
