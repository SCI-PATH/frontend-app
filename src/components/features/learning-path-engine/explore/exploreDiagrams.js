/**
 * Science-map stage images.
 * Prefer real photos (Unsplash / Wikimedia) for natural subjects;
 * use textbook-style illustrations only for microscopic/abstract structure.
 */

/** Stable photo CDNs (real photographs). */
const PHOTO = {
  greenhouse:
    "https://images.unsplash.com/photo-1466692476866-aef1dfb1e735?auto=format&fit=crop&w=1400&q=80",
  plant:
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1400&q=80",
  /** Close-up real leaf — green blade + veins */
  leaf:
    "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=1400&q=80",
  leaf_alt:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Leaf_1_web.jpg/1280px-Leaf_1_web.jpg",
  root:
    "https://images.unsplash.com/photo-1465146633011-14f8e0781093?auto=format&fit=crop&w=1400&q=80",
  bulb:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
  copper:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=80",
  lightbulb:
    "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=1400&q=80",
  magnet:
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=80",
  prism:
    "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1400&q=80",
  speaker:
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1400&q=80",
  ice:
    "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1400&q=80",
};

/** Wikimedia educational diagrams (reliable for school science). */
const WIKI = {
  plant_cell:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Plant_cell_structure_svg.svg/1200px-Plant_cell_structure_svg.svg.png",
  animal_cell:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Complete_animal_cell_diagram_en.svg/1200px-Complete_animal_cell_diagram_en.svg.png",
  chloroplast:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Chloroplast_ii.svg/1200px-Chloroplast_ii.svg.png",
  heart:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Diagram_of_the_human_heart_%28cropped%29.svg/1200px-Diagram_of_the_human_heart_%28cropped%29.svg.png",
  eye:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Schematic_diagram_of_the_human_eye_en.svg/1200px-Schematic_diagram_of_the_human_eye_en.svg.png",
  nucleus:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Diagram_human_cell_nucleus.svg/1200px-Diagram_human_cell_nucleus.svg.png",
  mito:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Animal_mitochondrion_diagram_en_%28edit%29.svg/1200px-Animal_mitochondrion_diagram_en_%28edit%29.svg.png",
  circuit:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Series_circuit.svg/1200px-Series_circuit.svg.png",
  atom:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Stylised_Lithium_Atom.svg/1200px-Stylised_Lithium_Atom.svg.png",
  sound:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Longitudinal_wave.svg/1200px-Longitudinal_wave.svg.png",
  ear:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Anatomy_of_the_Human_Ear.svg/1200px-Anatomy_of_the_Human_Ear.svg.png",
  matter:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/States_of_matter_En.svg/1200px-States_of_matter_En.svg.png",
  field:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/VFPt_dipole_magnetic1.svg/1200px-VFPt_dipole_magnetic1.svg.png",
  plant_anatomy:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Plant_anatomy.svg/1200px-Plant_anatomy.svg.png",
  body_circ:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Circulatory_System_en.svg/1200px-Circulatory_System_en.svg.png",
  reflection:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Law_of_reflection.svg/1200px-Law_of_reflection.svg.png",
  vacuole:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Plant_cell_structure_svg.svg/1200px-Plant_cell_structure_svg.svg.png",
};

/**
 * Level id → stage image (photo when real, diagram when structure matters).
 */
export const DIAGRAM_IMAGES = {
  garden: PHOTO.greenhouse,
  plant_body: PHOTO.plant,
  leaf: PHOTO.leaf,
  root: PHOTO.root,
  plant_cell: WIKI.plant_cell,
  chloroplast: WIKI.chloroplast,
  nucleus_plant: WIKI.nucleus,
  vacuole: WIKI.vacuole,

  body_view: WIKI.body_circ,
  heart: WIKI.heart,
  eye: WIKI.eye,
  animal_cell: WIKI.animal_cell,
  mito: WIKI.mito,
  nucleus_animal: WIKI.nucleus,

  room: PHOTO.bulb,
  circuit: WIKI.circuit,
  wire: PHOTO.copper,
  lamp: PHOTO.lightbulb,

  magnet_table: PHOTO.magnet,
  north_pole: WIKI.field,
  south_pole: WIKI.field,
  field: WIKI.field,
  domains: WIKI.field,

  lit_room: PHOTO.prism,
  beam: WIKI.reflection,
  eye_light: WIKI.eye,

  sound_stage: PHOTO.speaker,
  wave: WIKI.sound,
  ear: WIKI.ear,

  object: PHOTO.ice,
  particles: WIKI.matter,
  atom: WIKI.atom,
};

/** Optional chain when primary URL fails to load. */
export const DIAGRAM_FALLBACKS = {
  leaf: [PHOTO.leaf_alt, WIKI.plant_anatomy],
  plant_body: [WIKI.plant_anatomy, PHOTO.greenhouse],
  garden: [PHOTO.plant],
};

export function diagramForLevel(levelId) {
  if (!levelId) return null;
  return DIAGRAM_IMAGES[levelId] || null;
}

export function diagramFallbacks(levelId) {
  if (!levelId) return [];
  return DIAGRAM_FALLBACKS[levelId] || [];
}

export function diagramCredit(levelId) {
  const url = DIAGRAM_IMAGES[levelId];
  if (!url) return "";
  if (url.includes("unsplash.com")) return "Photo · Unsplash";
  if (url.includes("wikimedia.org")) return "Educational diagram · Wikimedia Commons";
  if (url.includes("pollinations.ai")) return "Educational science illustration";
  return "Educational reference";
}
