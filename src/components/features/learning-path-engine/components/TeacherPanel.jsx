"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import {
  deleteTeacherLessonImage,
  deleteTeacherLibrary,
  getCurriculum,
  getTeacherLessonMedia,
  getTeacherLibrary,
  putTeacherLessonLinks,
  putTeacherLessonVideos,
  regenerateTeacherLibrary,
  teacherGenerate,
  teacherPublish,
  updateTeacherLibrary,
  uploadTeacherLessonImage,
} from "../api/client.js";
import { notifyUserFacingError } from "../errors.js";
import { resolveMediaUrl } from "../utils/resolveMediaUrl.js";

const GRADE_OPTIONS = [6, 7, 8, 9];
const PROFILE_LABEL = {
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
  // Legacy aliases still shown if stored
  weak: "Basic",
  average: "Intermediate",
  strong: "Advanced",
  smart: "Advanced",
};

const EVENT = "lesson_start";
const TABS = [
  { id: "content", label: "Lesson content", icon: BookOpen },
  { id: "media", label: "Videos & images", icon: Video },
  { id: "materials", label: "Additional material", icon: Link2 },
];

export default function TeacherPanel({
  onBack = null,
  teacherId: teacherIdProp = "",
  backSlot = null,
  embedded = false,
} = {}) {
  const [teacherId] = useState(teacherIdProp || "");
  const [grade, setGrade] = useState(7);
  const [profile, setProfile] = useState("basic");
  const [lessonId, setLessonId] = useState("");
  const [curriculum, setCurriculum] = useState(null);
  const [tab, setTab] = useState("content");

  const [contentId, setContentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [meta, setMeta] = useState(null);
  const [previewMeta, setPreviewMeta] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [statusNote, setStatusNote] = useState("");

  const [mediaVideos, setMediaVideos] = useState([{ title: "", url: "" }]);
  const [materialLinks, setMaterialLinks] = useState([{ title: "", url: "" }]);
  const [mediaEmbed, setMediaEmbed] = useState("");
  const [mediaNote, setMediaNote] = useState("");
  const [materialsNote, setMaterialsNote] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [imageCaption, setImageCaption] = useState("");
  const [imageBusy, setImageBusy] = useState(false);

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
      const nextItems = data.items || [];
      const saved = nextItems[0];
      if (saved) {
        setContentId(saved.content_id);
        setEditText(saved.lesson_text || "");
        setMeta({
          grade: saved.grade,
          profile: saved.profile,
          lesson_id: saved.lesson_id,
          lesson_title: saved.lesson_title,
        });
        setStatusNote("Saved content loaded from the verified library.");
      } else {
        setContentId(null);
        setEditText("");
        setMeta(null);
        setStatusNote("No saved content yet for this chapter and level.");
      }
    } catch (err) {
      notifyUserFacingError(err, "teacher-library", { offline: false });
    } finally {
      setLoadingList(false);
    }
  }, [grade, profile, lessonId]);

  const loadMedia = useCallback(async () => {
    if (!lessonId) {
      setMediaVideos([{ title: "", url: "" }]);
      setMaterialLinks([{ title: "", url: "" }]);
      setMediaEmbed("");
      setMediaNote("");
      setMaterialsNote("");
      setGalleryImages([]);
      return;
    }
    try {
      const data = await getTeacherLessonMedia(lessonId);
      setMediaVideos(
        data.videos?.length
          ? data.videos.map((video) => ({ title: video.title || "", url: video.url || "" }))
          : [{ title: "", url: data.youtube_url || "" }],
      );
      setMaterialLinks(
        data.additional_materials?.length
          ? data.additional_materials.map((link) => ({
              title: link.title || "",
              url: link.url || "",
            }))
          : [{ title: "", url: "" }],
      );
      setMediaEmbed(data.youtube_embed_url || "");
      setGalleryImages(Array.isArray(data.gallery_images) ? data.gallery_images : []);
      setMediaNote(
        data.videos?.length
          ? `${data.videos.length} video${data.videos.length === 1 ? "" : "s"} saved.`
          : "No videos saved yet.",
      );
      setMaterialsNote(
        data.additional_materials?.length
          ? `${data.additional_materials.length} link${data.additional_materials.length === 1 ? "" : "s"} saved.`
          : "Add website URLs for extra reading or reference.",
      );
    } catch (err) {
      notifyUserFacingError(err, "teacher-media-load", { offline: false });
    }
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId || tab !== "content") return;
    const timer = window.setTimeout(() => void loadLibrary(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLibrary, lessonId, tab]);

  useEffect(() => {
    if (tab !== "media" && tab !== "materials") return;
    const timer = window.setTimeout(() => void loadMedia(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMedia, tab]);

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
    setPreviewMeta(null);
    setStatusNote(note);
  }

  async function onGenerate(e) {
    e.preventDefault();
    if (!lessonId) return;
    setGenerating(true);
    setStatusNote("Generating preview from textbook RAG…");
    try {
      const data = contentId
        ? await regenerateTeacherLibrary(contentId, teacherId)
        : await teacherGenerate({
            lesson_id: lessonId,
            profile,
            event: EVENT,
            teacher_id: teacherId,
          });
      setEditText(data.lesson_text || "");
      setPreviewMeta({
        lesson_id: data.lesson_id || lessonId,
        profile: data.profile || profile,
        topic_id: data.topic_id,
        minion_state: data.minion_state,
        presentation_mode: data.presentation_mode,
        chunk_ids: data.chunk_ids || [],
      });
      setStatusNote(
        contentId
          ? `Preview ready for ${PROFILE_LABEL[profile] || profile}. Review, edit if needed, then Save changes.`
          : `Preview ready (${PROFILE_LABEL[profile] || profile}). Review, then Save changes to publish for students.`,
      );
    } catch (err) {
      notifyUserFacingError(err, "teacher-generate", { offline: false });
      setStatusNote("Could not generate — check Chroma ingest and backend logs.");
    } finally {
      setGenerating(false);
    }
  }

  async function onUpdate() {
    if (!editText.trim()) return;
    setBusy(true);
    try {
      const publishPayload = {
        lesson_id: previewMeta?.lesson_id || lessonId,
        profile: previewMeta?.profile || profile,
        event: EVENT,
        lesson_text: editText,
        teacher_id: teacherId,
        topic_id: previewMeta?.topic_id,
        minion_state: previewMeta?.minion_state,
        presentation_mode: previewMeta?.presentation_mode,
        chunk_ids: previewMeta?.chunk_ids || [],
      };
      if (previewMeta || !contentId) {
        const lessonMeta = lessons.find((l) => l.lesson_id === (previewMeta?.lesson_id || lessonId));
        const saved = await teacherPublish({
          ...publishPayload,
          presentation_mode:
            publishPayload.presentation_mode ||
            (profile === "advanced" || profile === "strong" || profile === "smart"
              ? "continuous"
              : profile === "basic" || profile === "weak"
                ? "stepped"
                : "sectioned"),
        });
        applyRow(
          {
            ...saved,
            lesson_title: saved.lesson_title || lessonMeta?.display_title || lessonMeta?.title,
          },
          contentId
            ? `Regenerated and saved for ${PROFILE_LABEL[profile] || profile}.`
            : `Saved for Grade ${grade} · ${PROFILE_LABEL[profile] || profile}. Students at this level can load it now.`,
        );
        setPreviewMeta(null);
      } else if (contentId) {
        const saved = await updateTeacherLibrary(contentId, {
          lesson_text: editText,
          teacher_id: teacherId,
        });
        applyRow(saved, "Updated. Students will see the new text on next load.");
      }
      try {
        await loadLibrary();
      } catch (loadErr) {
        console.warn("[TeacherPanel] library refresh failed after save", loadErr);
      }
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

  async function onSaveMaterials() {
    if (!lessonId) return;
    setMediaBusy(true);
    try {
      const links = materialLinks
        .map((link, index) => ({
          title: link.title.trim() || `Resource ${index + 1}`,
          url: link.url.trim(),
        }))
        .filter((link) => link.url);
      const data = await putTeacherLessonLinks(lessonId, {
        links,
        teacher_id: teacherId,
      });
      setMaterialLinks(
        data.additional_materials?.length
          ? data.additional_materials.map((link) => ({
              title: link.title || "",
              url: link.url || "",
            }))
          : [{ title: "", url: "" }],
      );
      setMaterialsNote(
        data.additional_materials?.length
          ? `${data.additional_materials.length} link${data.additional_materials.length === 1 ? "" : "s"} saved.`
          : "Additional material cleared.",
      );
    } catch (err) {
      notifyUserFacingError(err, "teacher-materials-save", { offline: false });
    } finally {
      setMediaBusy(false);
    }
  }

  function applyMediaPackage(data) {
    if (!data) return;
    setGalleryImages(Array.isArray(data.gallery_images) ? data.gallery_images : []);
    setMediaEmbed(data.youtube_embed_url || "");
    if (data.videos?.length) {
      setMediaVideos(data.videos.map((video) => ({ title: video.title || "", url: video.url || "" })));
    }
  }

  async function onUploadImage(file) {
    if (!lessonId || !file) return;
    setImageBusy(true);
    try {
      const data = await uploadTeacherLessonImage(lessonId, {
        file,
        caption: imageCaption,
        teacher_id: teacherId,
      });
      applyMediaPackage(data);
      setImageCaption("");
      setMediaNote("Image uploaded to this chapter.");
    } catch (err) {
      notifyUserFacingError(err, "teacher-image-upload", { offline: false });
    } finally {
      setImageBusy(false);
    }
  }

  async function onDeleteImage(imageId) {
    if (!lessonId || !imageId) return;
    if (!window.confirm("Remove this image from the chapter gallery?")) return;
    setImageBusy(true);
    try {
      const data = await deleteTeacherLessonImage(lessonId, imageId);
      applyMediaPackage(data);
      setMediaNote("Image removed.");
    } catch (err) {
      notifyUserFacingError(err, "teacher-image-delete", { offline: false });
    } finally {
      setImageBusy(false);
    }
  }

  const chapterTitle =
    meta?.lesson_title ||
    lessons.find((l) => l.lesson_id === lessonId)?.display_title ||
    lessons.find((l) => l.lesson_id === lessonId)?.title ||
    "";

  const fieldClass =
    "mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-brand-background/80 px-3 text-brand-text outline-none transition-colors focus:border-brand-primary focus:bg-white focus:ring-3 focus:ring-brand-primary/20";

  return (
    <main
      className={`teacher-panel m-0 max-w-none p-0 text-brand-text ${
        embedded ? "min-h-0 bg-transparent pb-4" : "min-h-screen bg-brand-background pb-12"
      }`}
    >
      {!embedded ? (
        <div className="bg-gradient-to-br from-brand-special via-brand-primary to-brand-accent px-5 py-7 sm:px-8 lg:px-12">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
            <div className="text-white">
              <p className="m-0 text-xs font-bold tracking-[0.18em] uppercase opacity-80">
                Educator workspace
              </p>
              <h1 className="m-0 mt-1 text-2xl font-bold text-white sm:text-3xl">
                Content Generation
              </h1>
            </div>
            {backSlot
              ? backSlot
              : onBack
                ? (
                  <button
                    type="button"
                    className="m-0 w-auto rounded-full border border-white/50 bg-white px-4 py-2 text-sm font-semibold text-brand-primary"
                    onClick={onBack}
                  >
                    Back
                  </button>
                )
                : null}
          </div>
        </div>
      ) : null}

      <div className={embedded ? "w-full" : "mx-auto w-full max-w-6xl px-5 py-6 sm:px-8"}>
        <section className="mb-6 rounded-2xl border border-brand-secondary/25 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-sm font-bold uppercase tracking-wider text-brand-secondary">
                Context
              </p>
              <h2 className="m-0 mt-1 text-lg font-bold text-brand-text">
                Choose lesson context
              </h2>
              <p className="m-0 mt-1 text-sm text-brand-text/60">
                Saved verified content loads automatically when you change the selection.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-secondary/15 px-3 py-1.5 text-xs font-bold text-brand-text ring-1 ring-brand-secondary/25">
              <CheckCircle2 className="size-3.5 text-brand-secondary" aria-hidden />
              Verified library
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-[160px_190px_minmax(260px,1fr)]">
            <label className="m-0 text-sm font-semibold" htmlFor="tGrade">
              Grade
              <select
                id="tGrade"
                className={fieldClass}
                value={grade}
                onChange={(e) => {
                  setGrade(Number(e.target.value));
                  clearEditor();
                }}
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </label>
            <label className="m-0 text-sm font-semibold" htmlFor="tProfile">
              Student level
              <select
                id="tProfile"
                className={fieldClass}
                value={profile}
                onChange={(e) => {
                  setProfile(e.target.value);
                  clearEditor();
                }}
              >
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="m-0 text-sm font-semibold" htmlFor="tLesson">
              Chapter
              <select
                id="tLesson"
                className={fieldClass}
                value={lessonId}
                onChange={(e) => {
                  setLessonId(e.target.value);
                  clearEditor();
                }}
              >
                <option value="">Choose a chapter…</option>
                {lessons.map((l) => (
                  <option key={l.lesson_id} value={l.lesson_id}>
                    {l.display_title || l.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <div
          className="mb-6 grid grid-cols-1 gap-1.5 rounded-2xl border border-brand-surface bg-white p-1.5 shadow-sm sm:grid-cols-3"
          role="tablist"
          aria-label="Teacher content sections"
        >
          {TABS.map((item) => {
            const Icon = item.icon;
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`m-0 flex w-full items-center justify-center gap-2 rounded-xl border-0 px-4 py-3 text-sm font-bold transition-all duration-200 ${
                  selected
                    ? "bg-brand-primary text-white shadow-sm"
                    : "bg-transparent text-brand-text/65 hover:bg-brand-primary/10 hover:text-brand-primary"
                }`}
                onClick={() => setTab(item.id)}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "content" ? (
          <form className="overflow-hidden rounded-2xl border border-brand-primary/15 bg-white shadow-sm" onSubmit={onGenerate}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-surface bg-gradient-to-r from-brand-primary/5 via-white to-brand-secondary/5 p-5 sm:p-6">
              <div>
                <h2 className="m-0 flex items-center gap-2 text-xl font-bold text-brand-text">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                    <BookOpen className="size-4" aria-hidden />
                  </span>
                  Verified lesson content
                </h2>
                <p className="m-0 mt-1.5 text-sm text-brand-text/60">
                  {chapterTitle || "Select a chapter"} · Grade {grade} ·{" "}
                  {PROFILE_LABEL[profile] || profile}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                  contentId
                    ? "bg-brand-secondary/15 text-brand-text ring-brand-secondary/30"
                    : "bg-brand-accent/10 text-brand-accent ring-brand-accent/25"
                }`}
              >
                {contentId ? <CheckCircle2 className="size-3.5" aria-hidden /> : null}
                {loadingList ? "Loading…" : contentId ? "Saved and verified" : "Not generated"}
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <textarea
                id="editText"
                className="min-h-[480px] w-full resize-y rounded-2xl border border-brand-surface bg-brand-background/80 p-5 font-sans text-[15px] leading-7 text-brand-text outline-none transition-colors focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Saved content appears here automatically. Generate content if this chapter and level do not have an entry yet."
              />

              {statusNote ? (
                <p className="m-0 mt-3 rounded-xl border border-brand-primary/15 bg-brand-primary/10 px-4 py-3 text-sm text-brand-text">
                  {statusNote}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col-reverse gap-3 border-t border-brand-surface pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="m-0 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-accent/40 bg-white px-5 py-3 font-bold text-brand-accent transition-colors hover:bg-brand-accent hover:text-white sm:w-auto"
                  disabled={busy || generating || !contentId}
                  onClick={() => void onDelete()}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </button>
                <button
                  type="button"
                  className="m-0 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-primary bg-white px-5 py-3 font-bold text-brand-primary transition-colors hover:bg-brand-primary/10 sm:w-auto"
                  disabled={busy || generating || !editText.trim()}
                  onClick={() => void onUpdate()}
                >
                  <Save className="size-4" aria-hidden />
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="submit"
                  className="m-0 inline-flex w-full items-center justify-center gap-2 rounded-xl border-0 bg-brand-special px-5 py-3 font-bold text-white shadow-sm transition-colors hover:bg-brand-special/90 sm:w-auto"
                  disabled={generating || !lessonId}
                >
                  <RefreshCw className={`size-4 ${generating ? "animate-spin" : ""}`} aria-hidden />
                  {generating ? "Regenerating…" : contentId ? "Regenerate" : "Generate content"}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {tab === "media" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <section className="rounded-2xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Video className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="m-0 text-xl font-bold text-brand-text">Video library</h2>
                  <p className="m-0 mt-1 text-sm text-brand-text/60">
                    Add YouTube lessons in the order students should watch them.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {mediaVideos.map((video, index) => (
                  <div
                    className="grid gap-3 rounded-2xl border border-brand-surface bg-brand-background p-4 md:grid-cols-[minmax(150px,0.65fr)_minmax(240px,1.35fr)_auto]"
                    key={index}
                  >
                    <label className="m-0 text-sm font-semibold">
                      Video {index + 1} title
                      <input
                        className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-white px-3 outline-none focus:border-brand-primary"
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
                    <label className="m-0 text-sm font-semibold">
                      YouTube URL
                      <input
                        className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-white px-3 outline-none focus:border-brand-primary"
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
                      className="m-0 self-end rounded-xl border border-brand-accent bg-white px-4 py-3 text-sm font-bold text-brand-accent hover:bg-brand-accent hover:text-white"
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
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="m-0 w-auto rounded-xl border border-brand-primary bg-white px-4 py-2.5 text-sm font-bold text-brand-primary hover:bg-brand-primary/10"
                  onClick={() =>
                    setMediaVideos((current) => [...current, { title: "", url: "" }])
                  }
                  disabled={mediaBusy || mediaVideos.length >= 20}
                >
                  + Add video
                </button>
                <button
                  type="button"
                  className="m-0 w-auto rounded-xl border-0 bg-brand-primary px-5 py-2.5 text-sm font-bold text-white"
                  disabled={mediaBusy || !lessonId}
                  onClick={() => void onSaveYoutube()}
                >
                  <span className="inline-flex items-center gap-2">
                    <Save className="size-4" aria-hidden />
                    {mediaBusy ? "Saving…" : "Save video library"}
                  </span>
                </button>
              </div>
              {mediaEmbed ? (
                <div className="mt-5 overflow-hidden rounded-2xl border border-brand-surface bg-black">
                  <iframe
                    className="aspect-video w-full border-0"
                    src={mediaEmbed}
                    title="Chapter video preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-brand-special/20 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-special/10 text-brand-special">
                  <ImageIcon className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="m-0 text-xl font-bold text-brand-text">Images</h2>
                  <p className="m-0 mt-1 text-sm text-brand-text/60">
                    Upload photos from your device. Files are stored with this chapter.
                  </p>
                </div>
              </div>

              <label
                className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-brand-special/35 bg-brand-special/5 px-4 py-8 text-center"
                htmlFor="galleryUpload"
              >
                <Upload className="size-8 text-brand-special" aria-hidden />
                <p className="m-0 mt-2 font-bold">
                  {imageBusy ? "Uploading…" : "Click to upload an image"}
                </p>
                <p className="m-0 mt-1 text-sm text-brand-text/55">JPG, PNG, WEBP, or GIF · max 8 MB</p>
                <input
                  id="galleryUpload"
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={!lessonId || imageBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void onUploadImage(file);
                  }}
                />
              </label>

              <label className="mt-4 block text-sm font-semibold" htmlFor="imageCaption">
                Caption
                <input
                  id="imageCaption"
                  className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-brand-background px-3 outline-none focus:border-brand-special"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Optional caption"
                  disabled={!lessonId || imageBusy}
                />
              </label>

              {galleryImages.length ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {galleryImages.map((image) => (
                    <figure
                      className="m-0 overflow-hidden rounded-2xl border border-brand-surface bg-brand-background"
                      key={image.image_id}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="h-32 w-full object-cover"
                        src={resolveMediaUrl(image.image_url)}
                        alt={image.caption || "Lesson image"}
                      />
                      <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="truncate text-xs text-brand-text/70">
                          {image.caption || "No caption"}
                        </span>
                        <button
                          type="button"
                          className="m-0 w-auto rounded-lg border border-brand-accent bg-white px-2 py-1 text-xs font-bold text-brand-accent"
                          disabled={imageBusy}
                          onClick={() => void onDeleteImage(image.image_id)}
                        >
                          Delete
                        </button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="m-0 mt-4 rounded-xl bg-brand-background px-4 py-3 text-sm text-brand-text/60">
                  No images saved for this chapter yet.
                </p>
              )}
            </section>
          </div>
        ) : null}

        {tab === "materials" ? (
          <section className="rounded-2xl border border-brand-primary/15 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Link2 className="size-4" aria-hidden />
              </span>
              <div>
                <h2 className="m-0 text-xl font-bold text-brand-text">Additional material</h2>
                <p className="m-0 mt-1 text-sm text-brand-text/60">
                  Add links to websites, articles, or reference pages students can open while studying.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {materialLinks.map((link, index) => (
                <div
                  className="grid gap-3 rounded-2xl border border-brand-surface bg-brand-background p-4 md:grid-cols-[minmax(150px,0.65fr)_minmax(240px,1.35fr)_auto]"
                  key={index}
                >
                  <label className="m-0 text-sm font-semibold">
                    Label
                    <input
                      className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-white px-3 outline-none focus:border-brand-primary"
                      value={link.title}
                      onChange={(e) =>
                        setMaterialLinks((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, title: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder={`Resource ${index + 1}`}
                      disabled={!lessonId || mediaBusy}
                    />
                  </label>
                  <label className="m-0 text-sm font-semibold">
                    Website URL
                    <input
                      className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-white px-3 outline-none focus:border-brand-primary"
                      value={link.url}
                      onChange={(e) =>
                        setMaterialLinks((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, url: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="https://…"
                      disabled={!lessonId || mediaBusy}
                    />
                  </label>
                  <button
                    type="button"
                    className="m-0 self-end rounded-xl border border-brand-accent bg-white px-4 py-3 text-sm font-bold text-brand-accent hover:bg-brand-accent hover:text-white"
                    onClick={() =>
                      setMaterialLinks((current) =>
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
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="m-0 w-auto rounded-xl border border-brand-primary bg-white px-4 py-2.5 text-sm font-bold text-brand-primary hover:bg-brand-primary/10"
                onClick={() =>
                  setMaterialLinks((current) => [...current, { title: "", url: "" }])
                }
                disabled={mediaBusy || materialLinks.length >= 20}
              >
                + Add link
              </button>
              <button
                type="button"
                className="m-0 w-auto rounded-xl border-0 bg-brand-primary px-5 py-2.5 text-sm font-bold text-white"
                disabled={mediaBusy || !lessonId}
                onClick={() => void onSaveMaterials()}
              >
                <span className="inline-flex items-center gap-2">
                  <Save className="size-4" aria-hidden />
                  {mediaBusy ? "Saving…" : "Save additional material"}
                </span>
              </button>
            </div>

            {materialsNote ? (
              <p className="m-0 mt-4 rounded-xl bg-brand-primary/10 px-4 py-3 text-sm">{materialsNote}</p>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
