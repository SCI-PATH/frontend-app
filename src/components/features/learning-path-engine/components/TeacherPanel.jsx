"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
  Link2,
  Network,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import {
  addTeacherLessonImage,
  approveTeacherLessonSummary,
  deleteTeacherAr,
  deleteTeacherLessonImage,
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
  uploadTeacherLessonImage,
} from "../api/client.js";
import { notifyUserFacingError } from "../errors.js";
import { resolveMediaUrl } from "../utils/resolveMediaUrl.js";
import MindmapGraphic from "./MindmapGraphic.jsx";

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
  { id: "mindmap", label: "Mind map", icon: Network },
];

export default function TeacherPanel({ onBack, teacherId: teacherIdProp, backSlot }) {
  const [teacherId] = useState(teacherIdProp || "");
  const [grade, setGrade] = useState(7);
  const [profile, setProfile] = useState("basic");
  const [lessonId, setLessonId] = useState("");
  const [curriculum, setCurriculum] = useState(null);
  const [tab, setTab] = useState("content");

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
  const [galleryImages, setGalleryImages] = useState([]);
  const [imageCaption, setImageCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
      setMediaEmbed(data.youtube_embed_url || "");
      setMediaSummary(data.summary || null);
      setMediaImageUrl(data.summary_image_url || "");
      setMediaApproved(Boolean(data.summary_approved));
      setGalleryImages(Array.isArray(data.gallery_images) ? data.gallery_images : []);
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
    const timer = window.setTimeout(() => void loadLibrary(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLibrary, lessonId, tab]);

  useEffect(() => {
    if (tab !== "media" && tab !== "mindmap") return;
    const timer = window.setTimeout(() => {
      if (tab === "media") void loadAr();
      void loadMedia();
    }, 0);
    return () => window.clearTimeout(timer);
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
            profile === "advanced" || profile === "strong" || profile === "smart"
              ? "continuous"
              : profile === "basic" || profile === "weak"
                ? "stepped"
                : "sectioned",
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

  async function onAddImageUrl() {
    if (!lessonId || !imageUrl.trim()) return;
    setImageBusy(true);
    try {
      const data = await addTeacherLessonImage(lessonId, {
        image_url: imageUrl.trim(),
        caption: imageCaption,
        teacher_id: teacherId,
      });
      applyMediaPackage(data);
      setImageUrl("");
      setImageCaption("");
      setMediaNote("Image URL saved to this chapter.");
    } catch (err) {
      notifyUserFacingError(err, "teacher-image-url", { offline: false });
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

  return (
    <main className="teacher-panel m-0 max-w-none min-h-screen bg-brand-background p-0 pb-12 text-brand-text">
      <div className="bg-brand-primary px-5 py-7 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <div className="text-white">
            <p className="m-0 text-xs font-bold tracking-[0.18em] uppercase opacity-80">
              Educator workspace
            </p>
            <h1 className="m-0 mt-1 text-2xl font-bold text-white sm:text-3xl">
              Learning Content Studio
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

      <div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-12">
        <section className="mb-6 rounded-2xl border border-brand-surface bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-bold text-brand-text">Choose lesson context</h2>
              <p className="m-0 mt-1 text-sm text-brand-text/60">
                Saved verified content loads automatically when you change the selection.
              </p>
            </div>
            <span className="rounded-full bg-brand-secondary/15 px-3 py-1 text-xs font-bold text-brand-text">
              Neon verified library
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-[160px_190px_minmax(260px,1fr)]">
            <label className="m-0 text-sm font-semibold" htmlFor="tGrade">
              Grade
              <select
                id="tGrade"
                className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-brand-background px-3 text-brand-text outline-none focus:border-brand-primary"
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
                className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-brand-background px-3 text-brand-text outline-none focus:border-brand-primary"
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
                className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-brand-background px-3 text-brand-text outline-none focus:border-brand-primary"
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
          className="mb-6 grid grid-cols-1 gap-2 rounded-2xl border border-brand-surface bg-white p-2 sm:grid-cols-3"
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
                className={`m-0 flex w-full items-center justify-center gap-2 rounded-xl border-0 px-4 py-3 text-sm font-bold transition-colors ${
                  selected
                    ? "bg-brand-primary text-white"
                    : "bg-white text-brand-text/65 hover:bg-brand-primary/10 hover:text-brand-primary"
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
          <form className="rounded-2xl border border-brand-surface bg-white shadow-sm" onSubmit={onGenerate}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-surface p-5 sm:p-6">
              <div>
                <h2 className="m-0 flex items-center gap-2 text-xl font-bold">
                  <BookOpen className="size-5 text-brand-primary" aria-hidden />
                  Verified lesson content
                </h2>
                <p className="m-0 mt-1 text-sm text-brand-text/60">
                  {chapterTitle || "Select a chapter"} · Grade {grade} ·{" "}
                  {PROFILE_LABEL[profile] || profile}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  contentId
                    ? "bg-brand-secondary/15 text-brand-text"
                    : "bg-brand-accent/15 text-brand-accent"
                }`}
              >
                {contentId ? <CheckCircle2 className="size-3.5" aria-hidden /> : null}
                {loadingList ? "Loading…" : contentId ? "Saved and verified" : "Not generated"}
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <textarea
                id="editText"
                className="min-h-[520px] w-full resize-y rounded-2xl border border-brand-surface bg-brand-background p-5 font-sans text-[15px] leading-7 text-brand-text outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Saved content appears here automatically. Generate content if this chapter and level do not have an entry yet."
              />

              {statusNote ? (
                <p className="m-0 mt-3 rounded-xl bg-brand-primary/10 px-4 py-3 text-sm text-brand-text">
                  {statusNote}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col-reverse gap-3 border-t border-brand-surface pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="m-0 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-accent bg-white px-5 py-3 font-bold text-brand-accent hover:bg-brand-accent hover:text-white sm:w-auto"
                  disabled={busy || generating || !contentId}
                  onClick={() => void onDelete()}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </button>
                <button
                  type="button"
                  className="m-0 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-primary bg-white px-5 py-3 font-bold text-brand-primary hover:bg-brand-primary/10 sm:w-auto"
                  disabled={busy || generating || !editText.trim()}
                  onClick={() => void onUpdate()}
                >
                  <Save className="size-4" aria-hidden />
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="submit"
                  className="m-0 inline-flex w-full items-center justify-center gap-2 rounded-xl border-0 bg-brand-special px-5 py-3 font-bold text-white hover:bg-brand-special/90 sm:w-auto"
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
            <section className="rounded-2xl border border-brand-surface bg-white p-5 shadow-sm sm:p-6">
              <h2 className="m-0 flex items-center gap-2 text-xl font-bold">
                <Video className="size-5 text-brand-primary" aria-hidden />
                Video library
              </h2>
              <p className="m-0 mt-1 text-sm text-brand-text/60">
                Add YouTube lessons in the order students should watch them.
              </p>

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

            <section className="rounded-2xl border border-brand-surface bg-white p-5 shadow-sm sm:p-6">
              <h2 className="m-0 flex items-center gap-2 text-xl font-bold">
                <ImageIcon className="size-5 text-brand-special" aria-hidden />
                Images
              </h2>
              <p className="m-0 mt-1 text-sm text-brand-text/60">
                Upload photos or paste a public image URL. Files are stored with this chapter.
              </p>

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
              <label className="mt-4 block text-sm font-semibold" htmlFor="imageUrl">
                Or paste image URL
                <span className="mt-1.5 flex gap-2">
                  <input
                    id="imageUrl"
                    className="h-11 w-full rounded-xl border border-brand-surface bg-brand-background px-3 outline-none focus:border-brand-special"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                    disabled={!lessonId || imageBusy}
                  />
                  <button
                    type="button"
                    className="m-0 inline-flex w-auto shrink-0 items-center gap-1.5 rounded-xl border-0 bg-brand-special px-4 py-2.5 text-sm font-bold text-white"
                    disabled={!lessonId || imageBusy || !imageUrl.trim()}
                    onClick={() => void onAddImageUrl()}
                  >
                    <Link2 className="size-4" aria-hidden />
                    Add
                  </button>
                </span>
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

              <details className="mt-6 rounded-2xl border border-brand-surface bg-brand-background p-4">
                <summary className="cursor-pointer text-sm font-bold text-brand-text">
                  Optional 3D model (.glb)
                </summary>
                <label className="mt-4 block text-sm font-semibold" htmlFor="arModelUrl">
                  Hosted model URL
                  <input
                    id="arModelUrl"
                    className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-white px-3 outline-none focus:border-brand-special"
                    value={arModelUrl}
                    onChange={(e) => setArModelUrl(e.target.value)}
                    placeholder="https://…/model.glb"
                    disabled={!lessonId}
                  />
                </label>
                <label className="mt-4 block text-sm font-semibold" htmlFor="arCaption">
                  Caption
                  <input
                    id="arCaption"
                    className="mt-1.5 h-11 w-full rounded-xl border border-brand-surface bg-white px-3 outline-none focus:border-brand-special"
                    value={arCaption}
                    onChange={(e) => setArCaption(e.target.value)}
                    placeholder="Short model hint"
                    disabled={!lessonId}
                  />
                </label>
                {arNote ? <p className="m-0 mt-3 text-sm text-brand-text/60">{arNote}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="m-0 w-auto rounded-xl border-0 bg-brand-special px-4 py-2.5 text-sm font-bold text-white"
                    disabled={arBusy || !lessonId}
                    onClick={() => void onGenerateAr()}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="size-4" aria-hidden />
                      {arBusy ? "Generating…" : "Generate diagrams"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="m-0 w-auto rounded-xl border-0 bg-brand-primary px-4 py-2.5 text-sm font-bold text-white"
                    disabled={arBusy || !lessonId || !arModelUrl.trim()}
                    onClick={() => void onSaveAr()}
                  >
                    Save model
                  </button>
                  <button
                    type="button"
                    className="m-0 w-auto rounded-xl border border-brand-accent bg-white px-4 py-2.5 text-sm font-bold text-brand-accent"
                    disabled={arBusy || !lessonId || !arAvailable}
                    onClick={() => void onClearAr()}
                  >
                    Clear
                  </button>
                </div>
              </details>
            </section>
          </div>
        ) : null}

        {tab === "mindmap" ? (
          <section className="rounded-2xl border border-brand-surface bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="m-0 flex items-center gap-2 text-xl font-bold">
                  <Network className="size-5 text-brand-special" aria-hidden />
                  Chapter mind map
                </h2>
                <p className="m-0 mt-1 text-sm text-brand-text/60">
                  Generate from the saved lesson, review the result, then approve it for students.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  mediaApproved
                    ? "bg-brand-secondary/15 text-brand-text"
                    : mediaSummary
                      ? "bg-brand-accent/15 text-brand-accent"
                      : "bg-brand-surface text-brand-text/60"
                }`}
              >
                {mediaApproved ? "Approved" : mediaSummary ? "Draft" : "Not generated"}
              </span>
            </div>

            <div className="mt-6 min-h-[420px] rounded-2xl border border-brand-surface bg-brand-background p-4 sm:p-6">
              {mediaSummary ? (
                <div className="mx-auto max-w-4xl">
                  <div className="mb-5 text-center">
                    <h3 className="m-0 text-lg font-bold">{mediaSummary.title || "Summary"}</h3>
                    {mediaSummary.headline ? (
                      <p className="m-0 mt-1 text-sm text-brand-text/60">{mediaSummary.headline}</p>
                    ) : null}
                  </div>
                  <MindmapGraphic summary={mediaSummary} title={mediaSummary.title} />
                  {mediaImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="mx-auto mt-6 block max-h-[420px] max-w-full rounded-2xl border border-brand-surface bg-white object-contain"
                      src={mediaImageUrl}
                      alt="Generated lesson summary infographic"
                    />
                  ) : null}
                </div>
              ) : (
                <div className="grid min-h-[360px] place-content-center text-center">
                  <Network className="mx-auto size-12 text-brand-special/40" aria-hidden />
                  <p className="m-0 mt-3 font-bold">No mind map for this chapter yet</p>
                  <p className="m-0 mt-1 text-sm text-brand-text/55">
                    Save lesson content first, then generate the mind map.
                  </p>
                </div>
              )}
            </div>

            {mediaNote ? (
              <p className="m-0 mt-4 rounded-xl bg-brand-primary/10 px-4 py-3 text-sm">
                {mediaNote}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 border-t border-brand-surface pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="m-0 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-special bg-white px-5 py-3 font-bold text-brand-special hover:bg-brand-special/10 sm:w-auto"
                disabled={mediaBusy || !lessonId}
                onClick={() => void onGenerateSummary()}
              >
                <RefreshCw className={`size-4 ${mediaBusy ? "animate-spin" : ""}`} aria-hidden />
                {mediaBusy ? "Generating…" : mediaSummary ? "Regenerate mind map" : "Generate mind map"}
              </button>
              <button
                type="button"
                className="m-0 inline-flex w-full items-center justify-center gap-2 rounded-xl border-0 bg-brand-secondary px-5 py-3 font-bold text-brand-text disabled:opacity-50 sm:w-auto"
                disabled={mediaBusy || !lessonId || !mediaSummary || mediaApproved}
                onClick={() => void onApproveSummary()}
              >
                <CheckCircle2 className="size-4" aria-hidden />
                {mediaApproved ? "Approved" : "Approve for students"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
