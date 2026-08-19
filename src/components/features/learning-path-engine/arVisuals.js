/**
 * Local AR photos (frontend/public/ar) — always loads without external CDN failures.
 */

const VISUAL_MEDIA = {
  monocot: {
    src: "/ar/monocot.jpg",
    credit: "Grass / cereal — parallel veins",
    alt: "Close-up of a grass-like plant with parallel leaf veins",
  },
  dicot: {
    src: "/ar/dicot.jpg",
    credit: "Broad leaf — net-like veins",
    alt: "Sunlit broad leaf with branching veins",
  },
  plant: {
    src: "/ar/plant.jpg",
    credit: "Living plant",
    alt: "Green leafy plant",
  },
  leaf: {
    src: "/ar/leaf.jpg",
    credit: "Leaf detail",
    alt: "Green leaf close-up",
  },
  flower: {
    src: "/ar/flower.jpg",
    credit: "Flower",
    alt: "Blooming flower",
  },
  root: {
    src: "/ar/root.jpg",
    credit: "Plant and soil",
    alt: "Plants growing from soil",
  },
  magnet: {
    src: "/ar/magnet.jpg",
    credit: "Materials & magnetism",
    alt: "Scientific materials related to magnetism",
  },
  animal: {
    src: "/ar/animal.jpg",
    credit: "Animal life",
    alt: "Animal in nature",
  },
  cell: {
    src: "/ar/cell.jpg",
    credit: "Microscope science",
    alt: "Laboratory microscope",
  },
  water: {
    src: "/ar/water.jpg",
    credit: "Water",
    alt: "Clear blue water",
  },
  earth: {
    src: "/ar/earth.jpg",
    credit: "Earth from space",
    alt: "Planet Earth",
  },
  machine: {
    src: "/ar/machine.jpg",
    credit: "Machines / engineering",
    alt: "Mechanical gears and machinery",
  },
  electric: {
    src: "/ar/electric.jpg",
    credit: "Electricity",
    alt: "Power lines and electricity",
  },
  space: {
    src: "/ar/space.jpg",
    credit: "Space",
    alt: "Stars and space",
  },
  generic: {
    src: "/ar/generic.jpg",
    credit: "Science",
    alt: "Science laboratory",
  },
};

export function getArVisualMedia(visual) {
  return VISUAL_MEDIA[visual] || VISUAL_MEDIA.generic;
}
