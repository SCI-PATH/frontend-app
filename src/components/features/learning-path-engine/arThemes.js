/**
 * Lightweight lesson theme helpers (legacy for optional diagram assets).
 * Phone / Unity AR deep links removed — use ScienceExplorer instead.
 */

const MODELS = {
  plant:
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/DiffuseTransmissionPlant/glTF-Binary/DiffuseTransmissionPlant.glb",
  animal:
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Duck/glTF-Binary/Duck.glb",
  earth: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  machine: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
  water:
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb",
  matter:
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
  default:
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb",
};

const VISUAL_TO_MODEL = {
  monocot: "plant",
  dicot: "plant",
  plant: "plant",
  leaf: "plant",
  flower: "plant",
  root: "plant",
  magnet: "matter",
  animal: "animal",
  cell: "default",
  water: "water",
  earth: "earth",
  machine: "machine",
  electric: "machine",
  space: "earth",
  generic: "default",
};

const TITLE_THEMES = [
  {
    keys: ["plant", "leaf", "flower", "photosynthesis", "botany", "tree", "monocot", "dicot"],
    theme: "plant",
    emoji: "🌿",
    label: "Plants",
  },
  { keys: ["magnet"], theme: "matter", emoji: "🧲", label: "Magnets" },
  {
    keys: ["animal", "organism", "life cycle", "diversity"],
    theme: "animal",
    emoji: "🦆",
    label: "Living things",
  },
  { keys: ["electric", "circuit", "current"], theme: "machine", emoji: "⚡", label: "Electricity" },
  { keys: ["earth", "rock", "mineral", "soil"], theme: "earth", emoji: "🌍", label: "Earth" },
  { keys: ["water", "liquid"], theme: "water", emoji: "💧", label: "Water" },
  { keys: ["force", "motion", "machine"], theme: "machine", emoji: "⚙️", label: "Machines" },
  { keys: ["space", "solar", "planet"], theme: "earth", emoji: "🚀", label: "Space" },
];

export function modelUrlForVisual(visual) {
  const key = VISUAL_TO_MODEL[visual] || "default";
  return MODELS[key] || MODELS.default;
}

export function getLessonArTheme(lessonId, lessonTitle) {
  const hay = `${lessonId || ""} ${lessonTitle || ""}`.toLowerCase();
  for (const t of TITLE_THEMES) {
    if (t.keys.some((k) => hay.includes(k))) {
      return {
        theme: t.theme,
        emoji: t.emoji,
        label: t.label,
        model_url: MODELS[t.theme] || MODELS.default,
      };
    }
  }
  return {
    theme: "default",
    emoji: "🔬",
    label: "Science",
    model_url: MODELS.default,
  };
}
