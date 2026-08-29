export type DailyFact = {
  id: string;
  grade: 6 | 7 | 8 | 9;
  topic: string;
  headline: string;
  body: string;
};

/** Bite-sized science facts with a curious, playful tone for Grades 6–9. */
export const DAILY_FACTS: DailyFact[] = [
  // Grade 6
  {
    id: "g6-food-1",
    grade: 6,
    topic: "Food & Nutrition",
    headline: "Your brain is an energy hog",
    body: "Your brain is only about 2% of your body weight — but it burns roughly 20% of your energy. Carbs break into glucose, its favourite fuel. Skip lunch and your focus might ghost you.",
  },
  {
    id: "g6-light-1",
    grade: 6,
    topic: "Light & Shadows",
    headline: "A shadow is stolen sunlight",
    body: "Block light and you rob the ground behind you of photons. The Sun is so far away its rays arrive almost parallel, which is why sunny-day shadows look sharp enough to cut paper.",
  },
  {
    id: "g6-plants-1",
    grade: 6,
    topic: "Plants",
    headline: "Plants literally eat sunlight",
    body: "Leaves are solar panels painted green with chlorophyll. They grab CO₂ from the air, slurp water from roots, and cook sugar using sunlight. No sun? No lunch.",
  },
  {
    id: "g6-electricity-1",
    grade: 6,
    topic: "Electricity",
    headline: "Break the loop, kill the glow",
    body: "Electrons need a full circuit conga line — battery to bulb and back. Snap one wire and the whole party stops. That's why a loose connection can darken an entire string of lights.",
  },
  {
    id: "g6-motion-1",
    grade: 6,
    topic: "Motion",
    headline: "Your foot used to be a ruler",
    body: "Ancient traders measured with feet, cubits, and arm spans — chaos! The metre fixed the mess so your lab results, a football pitch, and a Mars rover all speak the same language.",
  },
  {
    id: "g6-life-1",
    grade: 6,
    topic: "Living Organisms",
    headline: "The seven-sign life checklist",
    body: "Move, breathe, sense, grow, reproduce, get rid of waste, and eat — tick all seven and biologists call you alive. Viruses? They cheat the list and spark endless science debates.",
  },
  {
    id: "g6-water-1",
    grade: 6,
    topic: "Changes Around Us",
    headline: "Ice floats because water rebels",
    body: "Most liquids shrink when they freeze. Water expands — ice is less dense, so it floats. Fish under frozen lakes owe their lives to this weird quirk of H₂O.",
  },
  {
    id: "g6-static-1",
    grade: 6,
    topic: "Electricity",
    headline: "Static shock = mini lightning",
    body: "Rub a balloon on your hair and electrons jump ship. Touch a metal doorknob and zap — that's a tiny lightning bolt between you and the metal. Same physics, smaller scale.",
  },

  // Grade 7
  {
    id: "g7-heat-1",
    grade: 7,
    topic: "Heat",
    headline: "Metal is lying to your fingers",
    body: "Wood and metal at room temperature are the same temp. Metal just steals heat from your hand faster, so it feels colder. Your skin got pranked by conductivity.",
  },
  {
    id: "g7-acids-1",
    grade: 7,
    topic: "Acids & Bases",
    headline: "Lemons are tiny acid bosses",
    body: "Lemon juice turns blue litmus red — full acid energy. Your stomach uses even stronger acid to digest food, protected by a lining so you don't digest yourself. Wild, but true.",
  },
  {
    id: "g7-respiration-1",
    grade: 7,
    topic: "Respiration",
    headline: "Sprint stairs, become a fire",
    body: "Burning needs oxygen — so do your cells. Race upstairs and your breathing spikes because muscles demand extra O₂ to smash glucose for energy. You're basically a controlled flame.",
  },
  {
    id: "g7-current-1",
    grade: 7,
    topic: "Electric Current",
    headline: "Flip a switch, wake a billion electrons",
    body: "Wires aren't empty tunnels — electrons nudge forward when voltage pushes them. Flip a switch and the whole circuit lights up in milliseconds. Fastest commute ever.",
  },
  {
    id: "g7-plants-1",
    grade: 7,
    topic: "Nutrition in Plants",
    headline: "Green leaves = built-in lunchboxes",
    body: "Chlorophyll makes leaves green AND catches sunlight to cook glucose. Bleach the green away and the plant starves even with water and air. Colour isn't just decoration — it's survival.",
  },
  {
    id: "g7-motion-1",
    grade: 7,
    topic: "Motion & Time",
    headline: "Sprint, then stroll — one honest number",
    body: "Average speed ignores the messy middle. Bolt the first lap and nap the second? Total distance ÷ total time still gives one number that tells the whole story.",
  },
  {
    id: "g7-mirror-1",
    grade: 7,
    topic: "Heat",
    headline: "Shiny surfaces snub heat",
    body: "Polished metal reflects heat radiation like a mirror bounces light. That's why rescue blankets look like sci-fi foil — they shove your body heat back at you instead of letting it escape.",
  },
  {
    id: "g7-acids-2",
    grade: 7,
    topic: "Acids & Bases",
    headline: "Baking soda is a secret base",
    body: "Mix it with vinegar and the fizz explosion is an acid–base reaction making CO₂ gas. Your kitchen is a chemistry lab — you just didn't label the beakers.",
  },

  // Grade 8
  {
    id: "g8-micro-1",
    grade: 8,
    topic: "Microorganisms",
    headline: "Bread rises from yeast burps",
    body: "Yeast eats sugar and releases CO₂ gas. Dough traps those bubbles like millions of tiny balloons — that's how a flat lump becomes a fluffy loaf. Biology smells amazing.",
  },
  {
    id: "g8-cell-1",
    grade: 8,
    topic: "The Cell",
    headline: "Every cell has a boss room",
    body: "The nucleus stores your DNA — the instruction manual for life. It orders the cell to grow, divide, or chill. No nucleus, no orders, no plan.",
  },
  {
    id: "g8-pressure-1",
    grade: 8,
    topic: "Force & Pressure",
    headline: "Thumbtacks hurt on purpose",
    body: "Pressure = force ÷ area. A thumbtack's tiny tip concentrates your push onto a pin-point. Same force, smaller area — physics turns a gentle press into a dramatic ouch.",
  },
  {
    id: "g8-combustion-1",
    grade: 8,
    topic: "Combustion",
    headline: "Fire is a three-player game",
    body: "Fuel + oxygen + heat. Remove any one and the flame rage-quits. Smother it, cool it, or cut the gas — same result: lights out.",
  },
  {
    id: "g8-metals-1",
    grade: 8,
    topic: "Metals",
    headline: "Copper wires are electron highways",
    body: "Electrons roam free in metals, which is why chargers work and pans heat evenly. Rubber blocks them — that's why bare wires and puddles are a terrible combo.",
  },
  {
    id: "g8-friction-1",
    grade: 8,
    topic: "Friction",
    headline: "No friction = accidental moonwalk",
    body: "Ice proves it — tiny steps, wild arm flailing. Friction between shoes and ground is the unsung hero stopping you from sliding into the nearest wall.",
  },
  {
    id: "g8-micro-2",
    grade: 8,
    topic: "Microorganisms",
    headline: "Some bacteria are your allies",
    body: "Your gut hosts trillions of microbes that help digest food and train your immune system. You're not just one organism — you're a walking ecosystem with VIP tenants.",
  },
  {
    id: "g8-cell-2",
    grade: 8,
    topic: "The Cell",
    headline: "Mitochondria have main-character energy",
    body: "These bean-shaped organelles turn glucose into ATP — the cell's energy coins. Muscle cells pack extra mitochondria because they burn fuel like athletes at a buffet.",
  },

  // Grade 9
  {
    id: "g9-matter-1",
    grade: 9,
    topic: "Matter",
    headline: "Smells sneak like gas ninjas",
    body: "Gas particles zoom randomly and spread out fast. One perfume spritz releases trillions of particles that eventually colonise every corner of the room. Stealth mode: unlocked.",
  },
  {
    id: "g9-atoms-1",
    grade: 9,
    topic: "Atoms",
    headline: "Change protons, change your element",
    body: "Carbon always has 6 protons — that's its ID card. Add one proton? You're nitrogen now. Atoms don't do fake profiles; proton count is identity.",
  },
  {
    id: "g9-gravity-1",
    grade: 9,
    topic: "Gravitation",
    headline: "You'd dunk easier on the Moon",
    body: "Same mass, one-sixth the gravity. You weigh far less on the Moon but your muscles are just as strong — hello, superhero jumps and slow-motion hops.",
  },
  {
    id: "g9-motion-1",
    grade: 9,
    topic: "Motion",
    headline: "Turning corners is secret acceleration",
    body: "Velocity includes direction. Steer a bike at steady speed and you're still accelerating because direction keeps changing. Physics doesn't accept loopholes.",
  },
  {
    id: "g9-tissues-1",
    grade: 9,
    topic: "Tissues",
    headline: "Muscles pull — they never push",
    body: "Muscle tissue only contracts. Biceps pull your arm up; triceps pull it back down. Your body is a tug-of-war machine, not a pushing machine.",
  },
  {
    id: "g9-energy-1",
    grade: 9,
    topic: "Work & Energy",
    headline: "Pushing a wall = zero work",
    body: "In physics, work needs movement in the force's direction (W = F × s). Flex on a brick wall all day — physics awards you exactly zero joules. Tough crowd.",
  },
  {
    id: "g9-matter-2",
    grade: 9,
    topic: "Matter",
    headline: "Absolute zero is the ultimate freeze",
    body: "At −273.15 °C particles barely move — the coldest possible temperature. You can't reach colder because atoms essentially hit the snooze button on motion.",
  },
  {
    id: "g9-atoms-2",
    grade: 9,
    topic: "Atoms",
    headline: "Atoms are mostly empty space",
    body: "If an atom's nucleus were a marble in the school gym, electrons would be specks near the walls. You're not solid — you're a stylishly arranged cloud of almost-nothing.",
  },
];

const SUPPORTED_GRADES = [6, 7, 8, 9] as const;

export function normalizeFactGrade(grade: number | null | undefined): 6 | 7 | 8 | 9 {
  if (grade === 6 || grade === 7 || grade === 8 || grade === 9) return grade;
  return 7;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Deterministic unsigned hash for stable daily rotation. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function factsForGrade(grade: number): DailyFact[] {
  const normalized = normalizeFactGrade(grade);
  const pool = DAILY_FACTS.filter((fact) => fact.grade === normalized);
  return pool.length > 0 ? pool : DAILY_FACTS;
}

export function pickDailyFact(options: {
  userId?: string | null;
  grade?: number | null;
  date?: Date;
}): DailyFact {
  const grade = normalizeFactGrade(options.grade ?? 7);
  const pool = factsForGrade(grade);
  const dateKey = localDateKey(options.date ?? new Date());
  const seed = `${options.userId?.trim() || "guest"}:${grade}:${dateKey}`;
  const index = hashString(seed) % pool.length;
  return pool[index]!;
}

export function formatFactDateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export { SUPPORTED_GRADES };
