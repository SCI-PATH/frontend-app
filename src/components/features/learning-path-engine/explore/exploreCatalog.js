/**
 * Science map catalog — hierarchical zoom levels for G6–9 topics.
 * Each world = a Google-Maps-style place: outside → structure → inside → detail.
 * Visuals are procedural stage themes + emojis (no Unity / phone AR).
 */

/** @typedef {{ id: string, label: string, x: number, y: number, targetLevelId: string, icon?: string }} Hotspot */
/** @typedef {{
 *   id: string,
 *   label: string,
 *   scale: string,
 *   title: string,
 *   blurb: string,
 *   facts: string[],
 *   emoji: string,
 *   parentId?: string | null,
 *   hue?: number,
 *   palette?: 'life'|'electric'|'magnet'|'light'|'sound'|'matter'|'space',
 *   hotspots?: Hotspot[],
 * }} ExploreLevel */

/** @typedef {{
 *   id: string,
 *   title: string,
 *   subtitle: string,
 *   grades: number[],
 *   emoji: string,
 *   accent: string,
 *   rootLevelId: string,
 *   lessonHints?: string[],
 *   topicHints?: string[],
 *   levels: Record<string, ExploreLevel>,
 * }} ExploreWorld */

/** @type {ExploreWorld[]} */
export const EXPLORE_WORLDS = [
  {
    id: "plants_cells",
    title: "Plants & plant cells",
    subtitle: "Garden → plant → tissue → cell → organelles",
    grades: [6, 7, 8, 9],
    emoji: "🌱",
    accent: "#70E000",
    rootLevelId: "garden",
    lessonHints: ["g6_sci_01", "g7_sci_01", "g8_sci_03", "g8_sci_11", "g8_sci_12", "g9_sci_07"],
    topicHints: ["PLA", "ORG", "PHO", "LIF", "GROWTH"],
    levels: {
      garden: {
        id: "garden",
        label: "Garden",
        scale: "Outside",
        title: "A living garden",
        blurb: "Zoom in on green life. Plants look different outside, but they are built from cells.",
        facts: [
          "Plants make food using sunlight (photosynthesis).",
          "Roots, stems, and leaves work as a team.",
          "Not every plant has bright flowers.",
        ],
        emoji: "🌳",
        hue: 130,
        palette: "life",
        hotspots: [
          { id: "hs_plant", label: "Flowering plant", x: 38, y: 62, targetLevelId: "plant_body", icon: "🌷" },
          { id: "hs_leaf", label: "Leaf close-up", x: 68, y: 48, targetLevelId: "leaf", icon: "🍃" },
        ],
      },
      plant_body: {
        id: "plant_body",
        label: "Whole plant",
        scale: "Organism",
        title: "Parts of a plant",
        blurb: "Outside: roots hold the plant and take water. Stem carries materials. Leaves catch light.",
        facts: [
          "Roots absorb water and minerals.",
          "Stem supports the plant and transports sap.",
          "Leaves are the main site of photosynthesis.",
        ],
        emoji: "🪴",
        parentId: "garden",
        hue: 120,
        palette: "life",
        hotspots: [
          { id: "hs_root", label: "Root tip", x: 48, y: 82, targetLevelId: "root", icon: "⬇️" },
          { id: "hs_leaf2", label: "Into a leaf", x: 62, y: 32, targetLevelId: "leaf", icon: "🍃" },
        ],
      },
      leaf: {
        id: "leaf",
        label: "Leaf tissue",
        scale: "Tissue",
        title: "Inside a leaf",
        blurb: "A leaf looks thin outside, but is packed with cells that trap light and exchange gases.",
        facts: [
          "Stomata are tiny pores for CO₂ and O₂.",
          "Chlorophyll gives the green colour.",
          "Veins carry water to every cell.",
        ],
        emoji: "🥬",
        parentId: "plant_body",
        hue: 110,
        palette: "life",
        hotspots: [
          { id: "hs_cell", label: "Plant cell", x: 50, y: 50, targetLevelId: "plant_cell", icon: "🔬" },
        ],
      },
      root: {
        id: "root",
        label: "Root",
        scale: "Organ",
        title: "Root view",
        blurb: "Underground outside view of anchorage and water uptake.",
        facts: [
          "Root hairs increase surface area.",
          "Water moves up by cohesion and osmosis.",
        ],
        emoji: "🪵",
        parentId: "plant_body",
        hue: 35,
        palette: "life",
        hotspots: [
          { id: "hs_cell_r", label: "Root cell", x: 52, y: 55, targetLevelId: "plant_cell", icon: "🔬" },
        ],
      },
      plant_cell: {
        id: "plant_cell",
        label: "Plant cell",
        scale: "Cell",
        title: "Zoom into a plant cell",
        blurb: "You are inside the plant cell. Drag to rotate the view. Tap organelles to learn more.",
        facts: [
          "Cell wall gives a firm outer box.",
          "Large vacuole stores water and keeps shape.",
          "Chloroplasts make food — animal cells lack these.",
        ],
        emoji: "🟢",
        parentId: "leaf",
        hue: 145,
        palette: "life",
        hotspots: [
          { id: "hs_chloro", label: "Chloroplast", x: 32, y: 42, targetLevelId: "chloroplast", icon: "☀️" },
          { id: "hs_nuc", label: "Nucleus", x: 58, y: 48, targetLevelId: "nucleus_plant", icon: "🟣" },
          { id: "hs_vac", label: "Vacuole", x: 72, y: 62, targetLevelId: "vacuole", icon: "💧" },
        ],
      },
      chloroplast: {
        id: "chloroplast",
        label: "Chloroplast",
        scale: "Organelle",
        title: "Chloroplast interior",
        blurb: "Deep zoom: the green factory of photosynthesis.",
        facts: [
          "Light energy → chemical energy in sugar.",
          "Oxygen is released as a by-product.",
        ],
        emoji: "✨",
        parentId: "plant_cell",
        hue: 100,
        palette: "life",
        hotspots: [],
      },
      nucleus_plant: {
        id: "nucleus_plant",
        label: "Nucleus",
        scale: "Organelle",
        title: "Control centre",
        blurb: "The nucleus stores genetic instructions for the cell.",
        facts: ["DNA is organised as chromosomes.", "Nuclear membrane has pores for signals."],
        emoji: "🟣",
        parentId: "plant_cell",
        hue: 280,
        palette: "life",
        hotspots: [],
      },
      vacuole: {
        id: "vacuole",
        label: "Vacuole",
        scale: "Organelle",
        title: "Central vacuole",
        blurb: "A large fluid sac that presses outward and stores materials.",
        facts: ["Helps keep the plant upright (turgor).", "Stores pigments and waste in some cells."],
        emoji: "🫧",
        parentId: "plant_cell",
        hue: 200,
        palette: "life",
        hotspots: [],
      },
    },
  },
  {
    id: "animal_cells",
    title: "Animal cells & body",
    subtitle: "Body → tissue → animal cell → organelles",
    grades: [6, 8, 9],
    emoji: "🫀",
    accent: "#FF6B35",
    rootLevelId: "body_view",
    lessonHints: ["g8_sci_09", "g9_sci_06", "g9_sci_02", "g7_sci_12"],
    topicHints: ["SYS", "BIO", "SEN", "HUMAN"],
    levels: {
      body_view: {
        id: "body_view",
        label: "Human body",
        scale: "Outside",
        title: "Systems work together",
        blurb: "From the outside you see a person; inside are organs and trillions of cells.",
        facts: [
          "Organ systems cooperate (e.g. circulatory + respiratory).",
          "Every organ is made of tissues of similar cells.",
        ],
        emoji: "🧍",
        hue: 12,
        palette: "life",
        hotspots: [
          { id: "hs_heart", label: "Heart region", x: 48, y: 42, targetLevelId: "heart", icon: "❤️" },
          { id: "hs_eye", label: "Eye", x: 52, y: 18, targetLevelId: "eye", icon: "👁️" },
        ],
      },
      heart: {
        id: "heart",
        label: "Heart",
        scale: "Organ",
        title: "Circulatory pump",
        blurb: "The heart pushes blood so cells get oxygen and food.",
        facts: ["Arteries carry blood away from the heart.", "Veins return blood toward the heart."],
        emoji: "💓",
        parentId: "body_view",
        hue: 0,
        palette: "life",
        hotspots: [
          { id: "hs_acell", label: "Heart muscle cell", x: 50, y: 50, targetLevelId: "animal_cell", icon: "🔬" },
        ],
      },
      eye: {
        id: "eye",
        label: "Eye",
        scale: "Organ",
        title: "Light enters the eye",
        blurb: "The eye focuses light so we can see the world outside.",
        facts: ["Cornea and lens bend light.", "Retina has receptor cells."],
        emoji: "👀",
        parentId: "body_view",
        hue: 200,
        palette: "light",
        hotspots: [
          { id: "hs_cell_e", label: "Receptor cell", x: 55, y: 55, targetLevelId: "animal_cell", icon: "🔬" },
        ],
      },
      animal_cell: {
        id: "animal_cell",
        label: "Animal cell",
        scale: "Cell",
        title: "Inside an animal cell",
        blurb: "No cell wall or chloroplasts — different from plant cells. Rotate the view.",
        facts: [
          "Flexible membrane outer boundary.",
          "Mitochondria release energy from food.",
          "Nucleus still holds the DNA instructions.",
        ],
        emoji: "🟠",
        parentId: "heart",
        hue: 25,
        palette: "life",
        hotspots: [
          { id: "hs_mito", label: "Mitochondrion", x: 35, y: 55, targetLevelId: "mito", icon: "⚡" },
          { id: "hs_nuc_a", label: "Nucleus", x: 58, y: 42, targetLevelId: "nucleus_animal", icon: "🟣" },
        ],
      },
      mito: {
        id: "mito",
        label: "Mitochondrion",
        scale: "Organelle",
        title: "Energy release",
        blurb: "Deep zoom: respiration happens on folded inner membranes.",
        facts: ["Turns food energy into usable ATP.", "Cells that work hard have many mitochondria."],
        emoji: "🔋",
        parentId: "animal_cell",
        hue: 40,
        palette: "life",
        hotspots: [],
      },
      nucleus_animal: {
        id: "nucleus_animal",
        label: "Nucleus",
        scale: "Organelle",
        title: "Genetic control",
        blurb: "Same role as in plant cells — instructions for growth and repair.",
        facts: ["DNA pairing rules stay the same across life.", "Cell division starts with nucleus signals."],
        emoji: "🧬",
        parentId: "animal_cell",
        hue: 280,
        palette: "life",
        hotspots: [],
      },
    },
  },
  {
    id: "electricity",
    title: "Electricity & circuits",
    subtitle: "Room → circuit board → component → current idea",
    grades: [6, 7, 8, 9],
    emoji: "⚡",
    accent: "#00A8E8",
    rootLevelId: "room",
    lessonHints: ["g6_sci_08", "g7_sci_02", "g7_sci_03", "g8_sci_07", "g8_sci_10", "g9_sci_10"],
    topicHints: ["ELE", "STA", "CIRCUIT"],
    levels: {
      room: {
        id: "room",
        label: "Powered room",
        scale: "Outside",
        title: "Electricity in daily life",
        blurb: "Lights and phones work because circuits close a path for charge.",
        facts: [
          "A complete loop is needed for current.",
          "Switches open or close the path.",
        ],
        emoji: "💡",
        hue: 195,
        palette: "electric",
        hotspots: [
          { id: "hs_circ", label: "Simple circuit", x: 55, y: 55, targetLevelId: "circuit", icon: "🔌" },
        ],
      },
      circuit: {
        id: "circuit",
        label: "Circuit",
        scale: "System",
        title: "Battery · wire · lamp",
        blurb: "Series path: current leaves the battery, passes the lamp, and returns.",
        facts: [
          "Battery is the energy source.",
          "Wires are conductors that guide charge.",
          "A break stops the current (open circuit).",
        ],
        emoji: "🔋",
        parentId: "room",
        hue: 200,
        palette: "electric",
        hotspots: [
          { id: "hs_wire", label: "Inside a wire", x: 40, y: 50, targetLevelId: "wire", icon: "🧵" },
          { id: "hs_lamp", label: "Lamp", x: 70, y: 40, targetLevelId: "lamp", icon: "💡" },
        ],
      },
      wire: {
        id: "wire",
        label: "Conductor",
        scale: "Material",
        title: "Copper path",
        blurb: "Electrons move slowly through metal — energy is carried by the electric field.",
        facts: [
          "Metals have free electrons.",
          "Insulators (plastic cover) stop current leaving the wire.",
        ],
        emoji: "🟠",
        parentId: "circuit",
        hue: 30,
        palette: "electric",
        hotspots: [],
      },
      lamp: {
        id: "lamp",
        label: "Lamp",
        scale: "Component",
        title: "Load in the circuit",
        blurb: "The lamp converts electric energy into light and heat.",
        facts: ["Resistance converts energy.", "Brighter often means more power used."],
        emoji: "✨",
        parentId: "circuit",
        hue: 50,
        palette: "electric",
        hotspots: [],
      },
    },
  },
  {
    id: "magnets",
    title: "Magnets & force",
    subtitle: "Bar magnet → poles → field → tiny domains idea",
    grades: [6, 8],
    emoji: "🧲",
    accent: "#7209B7",
    rootLevelId: "magnet_table",
    lessonHints: ["g6_sci_07", "g8_sci_06"],
    topicHints: ["MAG"],
    levels: {
      magnet_table: {
        id: "magnet_table",
        label: "Magnets",
        scale: "Outside",
        title: "Bar magnets on a table",
        blurb: "Magnets attract and repel without touching — a force field fills the space around them.",
        facts: [
          "Every magnet has a North and South pole.",
          "Like poles repel; unlike poles attract.",
        ],
        emoji: "🧲",
        hue: 280,
        palette: "magnet",
        hotspots: [
          { id: "hs_n", label: "North pole", x: 30, y: 50, targetLevelId: "north_pole", icon: "N" },
          { id: "hs_s", label: "South pole", x: 70, y: 50, targetLevelId: "south_pole", icon: "S" },
          { id: "hs_field", label: "Field lines", x: 50, y: 30, targetLevelId: "field", icon: "〰️" },
        ],
      },
      north_pole: {
        id: "north_pole",
        label: "North pole",
        scale: "Region",
        title: "Near the North pole",
        blurb: "Field lines emerge around the North pole region.",
        facts: ["Compass N points toward Earth's magnetic south region.", "Pole strength is strongest at ends."],
        emoji: "N",
        parentId: "magnet_table",
        hue: 350,
        palette: "magnet",
        hotspots: [
          { id: "hs_dom", label: "Magnetic domains", x: 50, y: 55, targetLevelId: "domains", icon: "⬅️" },
        ],
      },
      south_pole: {
        id: "south_pole",
        label: "South pole",
        scale: "Region",
        title: "Near the South pole",
        blurb: "Field lines return toward the South pole region.",
        facts: ["Opposite poles attract strongly when close.", "Cutting a magnet makes new N–S pairs."],
        emoji: "S",
        parentId: "magnet_table",
        hue: 220,
        palette: "magnet",
        hotspots: [
          { id: "hs_dom2", label: "Magnetic domains", x: 50, y: 55, targetLevelId: "domains", icon: "⬅️" },
        ],
      },
      field: {
        id: "field",
        label: "Field",
        scale: "Space around",
        title: "Magnetic field pattern",
        blurb: "Imagine invisible arrows (field lines) looping from N to S outside the magnet.",
        facts: [
          "Closer lines mean stronger field.",
          "Iron filings reveal the pattern.",
        ],
        emoji: "🌐",
        parentId: "magnet_table",
        hue: 260,
        palette: "magnet",
        hotspots: [],
      },
      domains: {
        id: "domains",
        label: "Domains",
        scale: "Micro",
        title: "Aligning domains (simple model)",
        blurb: "Deep zoom model: tiny regions point the same way in a strong magnet.",
        facts: [
          "In demagnetised metal, domains point randomly.",
          "Hammering or heat can scramble order.",
        ],
        emoji: "🧭",
        parentId: "north_pole",
        hue: 290,
        palette: "magnet",
        hotspots: [],
      },
    },
  },
  {
    id: "light",
    title: "Light & vision",
    subtitle: "Room → beam → eye → retina idea",
    grades: [6, 7, 9],
    emoji: "🌞",
    accent: "#FFB703",
    rootLevelId: "lit_room",
    lessonHints: ["g6_sci_05", "g7_sci_09", "g7_sci_10", "g9_sci_14"],
    topicHints: ["LIG", "MIC"],
    levels: {
      lit_room: {
        id: "lit_room",
        label: "Lit room",
        scale: "Outside",
        title: "We see when light reaches our eyes",
        blurb: "Sun or lamps send light. Objects reflect some of it toward you.",
        facts: ["Light travels in straight lines in air.", "Opaque objects cast shadows."],
        emoji: "🏠",
        hue: 45,
        palette: "light",
        hotspots: [
          { id: "hs_beam", label: "Light beam", x: 40, y: 40, targetLevelId: "beam", icon: "🔦" },
          { id: "hs_eye2", label: "Into the eye", x: 70, y: 50, targetLevelId: "eye_light", icon: "👁️" },
        ],
      },
      beam: {
        id: "beam",
        label: "Ray model",
        scale: "Path",
        title: "Ray of light",
        blurb: "Draw light as a ray to predict shadows, mirrors, and lenses.",
        facts: ["Angle of incidence = angle of reflection (mirrors).", "Refraction bends light at boundaries."],
        emoji: "➡️",
        parentId: "lit_room",
        hue: 50,
        palette: "light",
        hotspots: [],
      },
      eye_light: {
        id: "eye_light",
        label: "Eye",
        scale: "Organ",
        title: "Focusing light",
        blurb: "Cornea + lens form an image on the retina — then brain interprets.",
        facts: ["Pupil controls how much light enters.", "Retina is lined with light-sensitive cells."],
        emoji: "🧿",
        parentId: "lit_room",
        hue: 200,
        palette: "light",
        hotspots: [],
      },
    },
  },
  {
    id: "sound",
    title: "Sound",
    subtitle: "Source → wave in air → ear",
    grades: [6, 7, 8],
    emoji: "🔊",
    accent: "#00A8E8",
    rootLevelId: "sound_stage",
    lessonHints: ["g6_sci_06", "g7_sci_11", "g8_sci_05"],
    topicHints: ["SOU"],
    levels: {
      sound_stage: {
        id: "sound_stage",
        label: "Sounding object",
        scale: "Outside",
        title: "Something vibrates",
        blurb: "Sound begins with vibration. Air particles pass the disturbance as a wave.",
        facts: ["No medium → no ordinary sound (space is quiet).", "Louder = larger amplitude."],
        emoji: "🥁",
        hue: 190,
        palette: "sound",
        hotspots: [
          { id: "hs_wave", label: "Sound wave", x: 55, y: 45, targetLevelId: "wave", icon: "〰️" },
          { id: "hs_ear", label: "Ear", x: 80, y: 50, targetLevelId: "ear", icon: "👂" },
        ],
      },
      wave: {
        id: "wave",
        label: "Wave",
        scale: "Medium",
        title: "Compressions & rarefactions",
        blurb: "Particles of air move back and forth, transferring energy forward.",
        facts: ["Frequency relates to pitch.", "Speed depends on the medium."],
        emoji: "📡",
        parentId: "sound_stage",
        hue: 185,
        palette: "sound",
        hotspots: [],
      },
      ear: {
        id: "ear",
        label: "Ear",
        scale: "Organ",
        title: "Hearing path",
        blurb: "Outer ear collects; middle ear bones move; inner ear signals the brain.",
        facts: ["Eardrum vibrates with air pressure changes.", "Protect ears from very loud sounds."],
        emoji: "🦻",
        parentId: "sound_stage",
        hue: 15,
        palette: "sound",
        hotspots: [],
      },
    },
  },
  {
    id: "matter",
    title: "Matter & atoms",
    subtitle: "Object → particles → atoms (simple model)",
    grades: [6, 8, 9],
    emoji: "⚛️",
    accent: "#7209B7",
    rootLevelId: "object",
    lessonHints: ["g6_sci_02", "g8_sci_04", "g8_sci_08", "g9_sci_03", "g9_sci_11"],
    topicHints: ["MAT", "NAT", "CHA", "ATOMS"],
    levels: {
      object: {
        id: "object",
        label: "Everyday object",
        scale: "Outside",
        title: "Things are made of matter",
        blurb: "Solids, liquids, and gases look different because particles are arranged differently.",
        facts: [
          "Solid: particles close, fixed shape.",
          "Liquid: particles slide, fixed volume.",
          "Gas: particles far, fill the space.",
        ],
        emoji: "🧊",
        hue: 260,
        palette: "matter",
        hotspots: [
          { id: "hs_particles", label: "Particle view", x: 50, y: 50, targetLevelId: "particles", icon: "⚪" },
        ],
      },
      particles: {
        id: "particles",
        label: "Particles",
        scale: "Micro",
        title: "Particle model",
        blurb: "Heat speeds particles up — they push apart more in gas.",
        facts: ["Temperature links to average kinetic energy.", "Diffusion is particles mixing."],
        emoji: "❄️",
        parentId: "object",
        hue: 250,
        palette: "matter",
        hotspots: [
          { id: "hs_atom", label: "Atom model", x: 50, y: 50, targetLevelId: "atom", icon: "⚛️" },
        ],
      },
      atom: {
        id: "atom",
        label: "Atom",
        scale: "Atomic",
        title: "Simple atom diagram",
        blurb: "Nucleus in the centre; electrons occupy the surrounding space (simple school model).",
        facts: [
          "Protons and neutrons in the nucleus.",
          "Element identity comes from proton number.",
        ],
        emoji: "🌀",
        parentId: "particles",
        hue: 270,
        palette: "matter",
        hotspots: [],
      },
    },
  },
];

export function getWorldById(id) {
  return EXPLORE_WORLDS.find((w) => w.id === id) || null;
}

/**
 * Best-effort match for a lesson so Diagrams can open relevant map.
 * @param {{ lessonId?: string, topicId?: string, title?: string }} hint
 */
export function matchWorldForLesson(hint = {}) {
  const lid = (hint.lessonId || "").toLowerCase();
  const tid = (hint.topicId || "").toUpperCase();
  const title = (hint.title || "").toLowerCase();

  for (const w of EXPLORE_WORLDS) {
    if ((w.lessonHints || []).some((h) => lid === h.toLowerCase())) return w;
  }
  for (const w of EXPLORE_WORLDS) {
    if ((w.topicHints || []).some((h) => tid.includes(h))) return w;
  }
  if (/plant|photosynth|leaf|root|flower/.test(title)) return getWorldById("plants_cells");
  if (/magnet/.test(title)) return getWorldById("magnets");
  if (/electric|circuit|static|charge/.test(title)) return getWorldById("electricity");
  if (/sound|hear/.test(title)) return getWorldById("sound");
  if (/light|vision|mirror|lens|refract/.test(title)) return getWorldById("light");
  if (/cell|organism|body|heart|blood|eye/.test(title)) return getWorldById("animal_cells");
  if (/matter|atom|solid|liquid|gas|density/.test(title)) return getWorldById("matter");
  return EXPLORE_WORLDS[0];
}

/** Build breadcrumb from root → current. */
export function breadcrumbFor(world, levelId) {
  const trail = [];
  let id = levelId;
  const guard = new Set();
  while (id && world.levels[id] && !guard.has(id)) {
    guard.add(id);
    trail.unshift(world.levels[id]);
    id = world.levels[id].parentId || null;
  }
  return trail;
}
