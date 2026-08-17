"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveTeacherLessonSummary,
  deleteTeacherAr,
  deleteTeacherLibrary,
  generateTeacherLessonSummary,
  getCurriculum,
  getLessonAr,
  getTeacherLessonMedia,
  getTeacherLibrary,
  putTeacherAr,
  putTeacherLessonVideos,
  regenerateTeacherAr,
  teacherGenerate,
  teacherPublish,
  updateTeacherLibrary,
} from "../api/client.js";
import { notifyUserFacingError } from "../errors.js";
import TeacherTopicArGallery from "./TeacherTopicArGallery.jsx";
import MindmapGraphic from "./MindmapGraphic.jsx";

const GRADE_OPTIONS = [6, 7, 8, 9];
const PROFILE_LABEL = {
  weak: "Weak",
  average: "Average",
  strong: "Smart",
};

const EVENT = "lesson_start";
const TABS = [
  { id: "content", label: "Content" },
  { id: "diagrams", label: "Diagrams" },
  { id: "map", label: "Map" },
];

export default function TeacherPanel({ onBack, teacherId: teacherIdProp, backSlot }) {
  const [teacherId] = useState(teacherIdProp || "teacher-1");
  const [grade, setGrade] = useState(7);
  const [profile, setProfile] = useState("weak");
  const [lessonId, setLessonId] = useState("");
  const [curriculum, setCurriculum] = useState(null);
  const [tab, setTab] = useState("content");

  const [items, setItems] = useState([]);
  const [contentId, setContentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [meta, setMeta] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [statusNote, setStatusNote] = useState("");

  const [arModelUrl, setArModelUrl] = useState("");
  const [arCaption, setArCaption] = useState("");
  const [arAvailable, setArAvailable] = useState(false);
  const [arNote, setArNote] = useState("");
  const [arBusy, setArBusy] = useState(false);

  const [mediaVideos, setMediaVideos] = useState([{ title: "", url: "" }]);
  const [mediaSummary, setMediaSummary] = useState(null);
  const [mediaImageUrl, setMediaImageUrl] = useState("");
  const [mediaApproved, setMediaApproved] = useState(false);
  const [mediaEmbed, setMediaEmbed] = useState("");
  const [mediaNote, setMediaNote] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);

  const lessons = useMemo(() => curriculum?.lessons || [], [curriculum]);

  useEffect(() => {
    let cancelled = false;
    getCurriculum(grade)
      .then((c) => {
        if (cancelled) return;
        setCurriculum(c);
        const list = c?.lessons || [];
        setLessonId((prev) => {
          if (prev && list.some((l) => l.lesson_id === prev)) return prev;
          return list[0]?.lesson_id || "";
        });
      })
      .catch((err) => notifyUserFacingError(err, "teacher-curriculum", { offline: false }));
    return () => {
      cancelled = true;
    };
  }, [grade]);

  const loadLibrary = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await getTeacherLibrary({
        grade,
        profile,
        lesson_id: lessonId || undefined,
        event: EVENT,
      });
      setItems(data.items || []);
    } catch (err) {
      notifyUserFacingError(err, "teacher-library", { offline: false });
    } finally {
      setLoadingList(false);
    }
  }, [grade, profile, lessonId]);

  const loadAr = useCallback(async () => {
    if (!lessonId) {
      setArModelUrl("");
      setArCaption("");
      setArAvailable(false);
      setArNote("");
      return;
    }
    try {
      const data = await getLessonAr(lessonId, { generate: false });
      setArAvailable(Boolean(data.available));
      setArModelUrl(data.model_url || "");
      setArCaption(data.caption || "");
      const nScenes = data.payload?.scenes?.length || 0;
      setArNote(
        nScenes
          ? `Diagram pack: ${nScenes} scene(s)${data.cached ? " (saved)" : ""}.`
          : data.message || "No diagram pack yet — optional regenerate below.",
      );
    } catch (err) {
      notifyUserFacingError(err, "teacher-ar-load", { offline: false });
    }
  }, [lessonId]);

  const loadMedia = useCallback(async () => {
    if (!lessonId) {
      setMediaVideos([{ title: "", url: "" }]);
      setMediaSummary(null);
      setMediaImageUrl("");
      setMediaApproved(false);
      setMediaEmbed("");
      setMediaNote("");
      return;
    }
    try {
      const data = await getTeacherLessonMedia(lessonId);
      setMediaVideos(
        data.videos?.length
          ? data.videos.map((video) => ({ title: video.title || "", url: video.url || "" }))
          : [{ title: "", url: data.youtube_url || "" }],
      );
      setMediaEmbed(data.youtube_embed_url || "");
      setMediaSummary(data.summary || null);
      setMediaImageUrl(data.summary_image_url || "");
      setMediaApproved(Boolean(data.summary_approved));
      setMediaNote(
        data.summary_approved
          ? "Summary approved — students will see it next to the video."
          : data.summary
            ? "Draft summary generated — review then Approve for students."
            : "No summary yet. Generate after publishing lesson text.",
      );
    } catch (err) {
      notifyUserFacingError(err, "teacher-media-load", { offline: false });
    }
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId || tab !== "content") return;
    void loadLibrary();
  }, [loadLibrary, lessonId, tab]);

  useEffect(() => {
    if (tab !== "diagrams") return;
    void loadAr();
    void loadMedia();
  }, [loadAr, loadMedia, tab]);

  function applyRow(row, note = "") {
    setContentId(row.content_id);
    setEditText(row.lesson_text || "");
    setMeta({
      grade: row.grade,
      profile: row.profile,
      lesson_id: row.lesson_id,
      lesson_title: row.lesson_title,
    });
    setStatusNote(note);
  }

  function clearEditor(note = "") {
    setContentId(null);
    setEditText("");
    setMeta(null);
    setStatusNote(note);
  }

  async function onGenerate(e) {
    e.preventDefault();
    if (!lessonId) return;
    setGenerating(true);
    setStatusNote("Generating…");
    try {
      const data = await teacherGenerate({
        lesson_id: lessonId,
        profile,
        event: EVENT,
        teacher_id: teacherId,
      });
      const saved = await teacherPublish({
        lesson_id: data.lesson_id,
        profile: data.profile,
        event: EVENT,
        lesson_text: data.lesson_text,
        topic_id: data.topic_id,
        minion_state: data.minion_state,
        presentation_mode: data.presentation_mode,
        chunk_ids: data.chunk_ids || [],
        teacher_id: teacherId,
      });
      applyRow(
        saved,
        `Saved for Grade ${grade} · ${PROFILE_LABEL[profile] || profile}. Students at this level can load it now.`,
      );
      await loadLibrary();
    } catch (err) {
      notifyUserFacingError(err, "teacher-generate", { offline: false });
      setStatusNote("Could not generate — check backend and try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function onShowLesson() {
    if (!lessonId) return;
    setBusy(true);
    try {
      const data = await getTeacherLibrary({
        grade,
        profile,
        lesson_id: lessonId,
        event: EVENT,
      });
      const row = (data.items || [])[0];
      if (!row) {
        clearEditor("No saved lesson for this grade, level, and chapter yet. Generate one first.");
        await loadLibrary();
        return;
      }
      applyRow(row, "Loaded from library.");
      await loadLibrary();
    } catch (err) {
      notifyUserFacingError(err, "teacher-show", { offline: false });
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate() {
    if (!editText.trim()) return;
    setBusy(true);
    try {
      if (contentId) {
        const saved = await updateTeacherLibrary(contentId, {
          lesson_text: editText,
          teacher_id: teacherId,
        });
        applyRow(saved, "Updated. Students will see the new text on next load.");
      } else if (lessonId) {
        const lessonMeta = lessons.find((l) => l.lesson_id === lessonId);
        const saved = await teacherPublish({
          lesson_id: lessonId,
          profile,
          event: EVENT,
          lesson_text: editText,
          teacher_id: teacherId,
          presentation_mode:
            profile === "strong" ? "continuous" : profile === "weak" ? "stepped" : "sectioned",
          chunk_ids: [],
        });
        applyRow(
          {
            ...saved,
            lesson_title: saved.lesson_title || lessonMeta?.display_title || lessonMeta?.title,
          },
          "Saved to library.",
        );
      }
      await loadLibrary();
    } catch (err) {
      notifyUserFacingError(err, "teacher-update", { offline: false });
      setStatusNote("Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!contentId) {
      clearEditor("Nothing to delete for this selection.");
      return;
    }
    if (!window.confirm("Delete this lesson from the library? Students will no longer see it.")) {
      return;
    }
    setBusy(true);
    try {
      await deleteTeacherLibrary(contentId);
      clearEditor("Deleted from library.");
      await loadLibrary();
    } catch (err) {
      notifyUserFacingError(err, "teacher-delete", { offline: false });
    } finally {
      setBusy(false);
    }
  }

  async function onSaveAr() {
    if (!lessonId || !arModelUrl.trim()) return;
    setArBusy(true);
    try {
      const lessonMeta = lessons.find((l) => l.lesson_id === lessonId);
      await putTeacherAr(lessonId, {
        model_url: arModelUrl.trim(),
        caption: arCaption,
        title: lessonMeta?.title,
        grade,
      });
      setArNote("Optional model saved for this chapter.");
      setArAvailable(true);
      await loadAr();
    } catch (err) {
      notifyUserFacingError(err, "teacher-ar-save", { offline: false });
    } finally {
      setArBusy(false);
    }
  }

  async function onClearAr() {
    if (!lessonId || !arAvailable) return;
    if (!window.confirm("Remove the diagram package for this chapter?")) return;
    setArBusy(true);
    try {
      await deleteTeacherAr(lessonId);
      setArModelUrl("");
      setArCaption("");
      setArAvailable(false);
      setArNote("Diagram package cleared.");
      await loadAr();
    } catch (err) {
      notifyUserFacingError(err, "teacher-ar-delete", { offline: false });
    } finally {
      setArBusy(false);
    }
  }

  async function onGenerateAr() {
    if (!lessonId) return;
    setArBusy(true);
    try {
      const data = await regenerateTeacherAr(lessonId);
      setArAvailable(Boolean(data.available));
      setArCaption(data.caption || "");
      const n = data.payload?.scenes?.length || 0;
      setArNote(
        data.available
          ? `Generated ${n} diagram scene(s) from published lesson text.`
          : data.message || "Could not generate — publish lesson text in Content first.",
      );
      await loadAr();
    } catch (err) {
      notifyUserFacingError(err, "teacher-ar-generate", { offline: false });
    } finally {
      setArBusy(false);
    }
  }

  async function onSaveYoutube() {
    if (!lessonId) return;
    setMediaBusy(true);
    try {
      const videos = mediaVideos
        .map((video, index) => ({
          title: video.title.trim() || `Video ${index + 1}`,
          url: video.url.trim(),
        }))
        .filter((video) => video.url);
      const data = await putTeacherLessonVideos(lessonId, {
        videos,
        teacher_id: teacherId,
      });
      setMediaEmbed(data.youtube_embed_url || "");
      setMediaVideos(
        data.videos?.length
          ? data.videos.map((video) => ({ title: video.title || "", url: video.url || "" }))
          : [{ title: "", url: "" }],
      );
      setMediaNote(
        data.videos?.length
          ? `${data.videos.length} video${data.videos.length === 1 ? "" : "s"} saved for this chapter.`
          : "Video library cleared.",
      );
    } catch (err) {
      notifyUserFacingError(err, "teacher-youtube-save", { offline: false });
    } finally {
      setMediaBusy(false);
    }
  }

  async function onGenerateSummary() {
    if (!lessonId) return;
    setMediaBusy(true);
    try {
      const data = await generateTeacherLessonSummary(lessonId, teacherId);
      setMediaSummary(data.summary || null);
      setMediaImageUrl(data.summary_image_url || "");
      setMediaApproved(Boolean(data.summary_approved));
      setMediaNote(
        data.summary_image_url
          ? "Draft summary + image ready — Approve so students see the mindmap."
          : "Draft summary ready (image service optional). Approve so students see the mindmap.",
      );
    } catch (err) {
      notifyUserFacingError(err, "teacher-summary-generate", { offline: false });
    } finally {
      setMediaBusy(false);
    }
  }

  async function onApproveSummary() {
    if (!lessonId) return;
    setMediaBusy(true);
    try {
      const data = await approveTeacherLessonSummary(lessonId, teacherId);
      setMediaSummary(data.summary || null);
      setMediaImageUrl(data.summary_image_url || "");
      setMediaApproved(Boolean(data.summary_approved));
      setMediaNote("Summary approved — students will see it.");
    } catch (err) {
      notifyUserFacingError(err, "teacher-summary-approve", { offline: false });
    } finally {
      setMediaBusy(false);
    }
  }

  const chapterTitle =
    meta?.lesson_title ||
    lessons.find((l) => l.lesson_id === lessonId)?.display_title ||
    lessons.find((l) => l.lesson_id === lessonId)?.title ||
    "";

  return (
    <main className="teacher-panel mx-auto max-w-5xl px-4 py-6 text-brand-text">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-text">SCI-PATH · Content generation</h1>
        {backSlot
          ? backSlot
          : onBack
            ? (
              <button type="button" className="btn-secondary teacher-panel__back" onClick={onBack}>
                Back
              </button>
            )
            : null}
      </div>

      <div className="card teacher-panel__chrome ring-1 ring-brand-surface">
        <p className="hint teacher-panel__chrome-hint">
          Pick grade, level, and chapter. Work in one tab at a time — Content (text), Diagrams
          (video & media), Map (science explorer).
        </p>
        <div className="teacher-panel__filters">
          <label htmlFor="tGrade">
            Grade
            <select
              id="tGrade"
              value={grade}
              onChange={(e) => {
                setGrade(Number(e.target.value));
                clearEditor();
              }}
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="tProfile">
            Level
            <select
              id="tProfile"
              value={profile}
              onChange={(e) => {
                setProfile(e.target.value);
                clearEditor();
              }}
            >
              <option value="weak">Weak</option>
              <option value="average">Average</option>
              <option value="strong">Smart</option>
            </select>
          </label>

          <label htmlFor="tLesson">
            Chapter
            <select
              id="tLesson"
              value={lessonId}
              onChange={(e) => {
                setLessonId(e.target.value);
                clearEditor();
              }}
            >
              <option value="">Choose…</option>
              {lessons.map((l) => (
                <option key={l.lesson_id} value={l.lesson_id}>
                  {l.display_title || l.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="teacher-tabs" role="tablist" aria-label="Teacher sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "teacher-tabs__btn is-active" : "teacher-tabs__btn"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "content" ? (
        <>
          <form className="card" onSubmit={onGenerate}>
            <h2 className="card__h">Lesson text</h2>
            <p className="hint">
              Generate or edit text for this <strong>level</strong> only. Students need a matching
              level (e.g. weak vs average) saved here to start that chapter.
            </p>

            <div className="teacher-panel__actions">
              <button type="submit" disabled={generating || !lessonId}>
                {generating ? "Generating…" : "Generate & save"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={busy || generating || !lessonId}
                onClick={() => void onShowLesson()}
              >
                Load saved
              </button>
            </div>

            {statusNote ? <p className="hint">{statusNote}</p> : null}
            {loadingList ? <p className="small">Refreshing library…</p> : null}
            {items.length ? (
              <p className="small">
                Library: {items.length} saved lesson{items.length === 1 ? "" : "s"}
                {contentId ? " · editing entry" : ""}
              </p>
            ) : lessonId ? (
              <p className="small">No library entry yet for this grade / level / chapter.</p>
            ) : null}

            {chapterTitle || lessonId ? (
              <p className="small teacher-panel__context">
                {chapterTitle || lessonId}
                {" · "}
                Grade {grade} · {PROFILE_LABEL[profile] || profile}
              </p>
            ) : null}

            <textarea
              id="editText"
              className="teacher-panel__textarea"
              rows={16}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Generate or load a lesson to edit here."
            />

            <div className="teacher-panel__actions">
              <button
                type="button"
                disabled={busy || generating || !editText.trim()}
                onClick={() => void onUpdate()}
              >
                {busy ? "Saving…" : "Save / update"}
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={busy || generating || !contentId}
                onClick={() => void onDelete()}
              >
                Delete
              </button>
            </div>
          </form>
        </>
      ) : null}

      {tab === "diagrams" ? (
        <>
          <div className="card">
            <h2 className="card__h">Video & summary</h2>
            <p className="hint">
              Add an ordered YouTube library and one summary graphic per chapter. Students can
              expand the library and scroll through every video.
            </p>
            <div className="teacher-video-editor">
              {mediaVideos.map((video, index) => (
                <div className="teacher-video-editor__row" key={index}>
                  <label>
                    Video {index + 1} title
                    <input
                      value={video.title}
                      onChange={(e) =>
                        setMediaVideos((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, title: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder={`Video ${index + 1}`}
                      disabled={!lessonId || mediaBusy}
                    />
                  </label>
                  <label>
                    YouTube URL
                    <input
                      value={video.url}
                      onChange={(e) =>
                        setMediaVideos((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, url: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="https://www.youtube.com/watch?v=…"
                      disabled={!lessonId || mediaBusy}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-secondary teacher-video-editor__remove"
                    onClick={() =>
                      setMediaVideos((current) =>
                        current.length === 1
                          ? [{ title: "", url: "" }]
                          : current.filter((_, i) => i !== index),
                      )
                    }
                    disabled={mediaBusy}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setMediaVideos((current) => [...current, { title: "", url: "" }])
                }
                disabled={mediaBusy || mediaVideos.length >= 20}
              >
                + Add another video
              </button>
            </div>
            <div className="teacher-panel__actions">
              <button
                type="button"
                disabled={mediaBusy || !lessonId}
                onClick={() => void onSaveYoutube()}
              >
                {mediaBusy ? "Working…" : "Save video library"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={mediaBusy || !lessonId}
                onClick={() => void onGenerateSummary()}
              >
                Generate summary
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={mediaBusy || !lessonId || !mediaSummary || mediaApproved}
                onClick={() => void onApproveSummary()}
              >
                Approve summary
              </button>
            </div>
            {mediaNote ? <p className="hint">{mediaNote}</p> : null}
            {mediaEmbed ? (
              <p className="small">
                Embed ready: <code>{mediaEmbed}</code>
              </p>
            ) : null}
            {mediaSummary ? (
              <div className="teacher-media-preview">
                <p className="small">
                  <strong>{mediaSummary.title || "Summary"}</strong>
                  {mediaApproved ? " · approved" : " · draft"}
                </p>
                {mediaSummary.headline ? <p className="hint">{mediaSummary.headline}</p> : null}
                <MindmapGraphic summary={mediaSummary} title={mediaSummary.title} />
                {mediaImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="teacher-media-preview__img"
                    src={mediaImageUrl}
                    alt="Generated lesson summary infographic"
                  />
                ) : (
                  <p className="small">
                    Optional AI image not available — students still get the mindmap after Approve.
                  </p>
                )}
                {mediaSummary.branches?.length ? (
                  <ul className="teacher-media-preview__branches">
                    {mediaSummary.branches.map((b) => (
                      <li key={b.id || b.label}>
                        <strong>{b.label}</strong>
                        {b.points?.length ? (
                          <ul>
                            {b.points.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="card">
            <h2 className="card__h">Optional diagram pack</h2>
            <p className="hint">
              Optional cartoon scenes for this chapter. Not required for students — they use the
              Map tab / science map. Publish content first if you regenerate.
            </p>
            <div className="teacher-panel__actions">
              <button
                type="button"
                disabled={arBusy || !lessonId}
                onClick={() => void onGenerateAr()}
              >
                {arBusy ? "Working…" : "Regenerate diagram pack"}
              </button>
            </div>
            <label htmlFor="arModelUrl">Optional model URL (.glb)</label>
            <input
              id="arModelUrl"
              value={arModelUrl}
              onChange={(e) => setArModelUrl(e.target.value)}
              placeholder="https://…/model.glb"
              disabled={!lessonId}
            />
            <label htmlFor="arCaption">Caption</label>
            <input
              id="arCaption"
              value={arCaption}
              onChange={(e) => setArCaption(e.target.value)}
              placeholder="Short hint"
              disabled={!lessonId}
            />
            {arNote ? <p className="hint">{arNote}</p> : null}
            <div className="teacher-panel__actions">
              <button
                type="button"
                disabled={arBusy || !lessonId || !arModelUrl.trim()}
                onClick={() => void onSaveAr()}
              >
                {arBusy ? "Saving…" : "Save model"}
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={arBusy || !lessonId || !arAvailable}
                onClick={() => void onClearAr()}
              >
                Clear pack
              </button>
            </div>
          </div>
        </>
      ) : null}

      {tab === "map" ? (
        <div className="teacher-panel__map-tab">
          <TeacherTopicArGallery />
        </div>
      ) : null}
    </main>
  );
}
