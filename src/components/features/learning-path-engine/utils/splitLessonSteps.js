/**
 * Split lesson text into paragraph-sized reading cards.
 * Sentences stay intact, but related ideas are grouped to avoid dozens of tiny steps.
 */

const PROFILE_CONFIG = {
  basic: { mode: "stepped" },
  intermediate: { mode: "stepped" },
  advanced: { mode: "stepped" },
  weak: { mode: "stepped" },
  average: { mode: "stepped" },
  strong: { mode: "stepped" },
};

const GO_DEEPER_RE = /^go deeper\s*$/i;
const RECAP_HEADING_RE =
  /^(?:recap|quick recap|summary|key takeaways|things to remember|remember)\s*:?\s*$/i;

/** @param {string} [profile] basic | intermediate | advanced (legacy: weak | average | strong | smart) */
export function stepLimitsForProfile(profile) {
  const key = (profile || "basic").toLowerCase();
  if (key === "advanced" || key === "strong" || key === "smart") {
    return { ...PROFILE_CONFIG.advanced };
  }
  if (key === "intermediate" || key === "average" || key === "typical") {
    return { ...PROFILE_CONFIG.intermediate };
  }
  return { ...PROFILE_CONFIG.basic };
}

/** @param {string} [profile] */
export function presentationModeForProfile(profile) {
  return stepLimitsForProfile(profile).mode;
}

export function hintForPresentation() {
  return "Read this idea, then continue when you feel ready.";
}

/**
 * @param {string} lessonText
 * @param {string | number} [profileOrMax] profile name (legacy number ignored for length)
 */
export function splitLessonIntoSteps(lessonText, profileOrMax = "basic") {
  if (!lessonText?.trim()) return [];

  let text = lessonText.trim().replace(/\r\n/g, "\n");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
  text = stripLeadingHeading(text);
  text = stripRecapSections(text);

  const sentences = splitOneSentencePerSlide(text);
  const steps = groupSentencesIntoParagraphs(sentences, profileOrMax);
  return steps.length ? steps : [text.trim()].filter(Boolean);
}

function groupSentencesIntoParagraphs(sentences, profile) {
  if (sentences.length <= 1) return sentences;

  const { targetWords, maxSentences } = paragraphLimits(profile);
  const grouped = [];
  let card = [];
  let words = 0;

  for (const sentence of sentences) {
    if (/^go deeper$/i.test(sentence)) {
      if (card.length) grouped.push(card.join(" "));
      grouped.push(sentence);
      card = [];
      words = 0;
      continue;
    }

    const sentenceWords = sentence.split(/\s+/).filter(Boolean).length;
    const full =
      card.length >= maxSentences ||
      (card.length >= 1 && words + sentenceWords > targetWords);
    if (full) {
      grouped.push(card.join(" "));
      card = [];
      words = 0;
    }
    card.push(sentence);
    words += sentenceWords;
  }

  if (card.length) grouped.push(card.join(" "));
  return grouped.filter(Boolean);
}

/** Per-profile slide size: fewer sentences per card = more steps, less clutter. */
function paragraphLimits(profile) {
  const key = String(profile || "basic").toLowerCase();
  if (key === "advanced" || key === "strong" || key === "smart") {
    return { targetWords: 70, maxSentences: 2 };
  }
  if (key === "intermediate" || key === "average" || key === "typical") {
    return { targetWords: 55, maxSentences: 2 };
  }
  // basic / weak — one short idea per slide
  return { targetWords: 42, maxSentences: 1 };
}

/** Drop trailing / mid lesson "Recap" blocks from older generated text. */
function stripRecapSections(text) {
  const sections = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const kept = [];
  let dropping = false;
  for (const section of sections) {
    const firstLine = section.split("\n")[0].trim();
    if (RECAP_HEADING_RE.test(firstLine) || RECAP_HEADING_RE.test(section)) {
      dropping = true;
      continue;
    }
    // Bullet-only block right after a recap heading already dropped — still skip
    // generic "Recap:" inline starts
    if (/^(?:recap|quick recap|summary)\s*:/i.test(section)) {
      continue;
    }
    if (dropping && GO_DEEPER_RE.test(section)) {
      dropping = false;
    }
    if (dropping) continue;
    kept.push(section);
  }
  return kept.join("\n\n");
}

function splitOneSentencePerSlide(text) {
  const rawSections = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const steps = [];

  for (let i = 0; i < rawSections.length; i += 1) {
    const section = rawSections[i];

    if (GO_DEEPER_RE.test(section)) {
      steps.push("Go deeper");
      const deeperBody = rawSections.slice(i + 1).join("\n\n").trim();
      if (deeperBody) {
        pushSentences(deeperBody, steps);
      }
      break;
    }

    const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
    const isBullet = (l) =>
      /^[-•\u2022]\s+/.test(l) ||
      /^[-*]\s+/.test(l) ||
      /^\d+[.)]\s+/.test(l);

    const bullets = lines.filter(isBullet);
    const nonBullets = lines.filter((l) => !isBullet(l));

    if (bullets.length > 0) {
      if (nonBullets.length > 0) {
        pushSentences(nonBullets.join(" "), steps);
      }
      for (const raw of bullets) {
        const clean = raw
          .replace(/^[-•\u2022*]\s+/, "")
          .replace(/^\d+[.)]\s+/, "")
          .trim();
        if (clean) pushSentences(clean, steps);
      }
    } else {
      pushSentences(section.replace(/\n/g, " ").replace(/\s+/g, " ").trim(), steps);
    }
  }

  return steps;
}

function pushSentences(block, steps) {
  if (!block) return;
  for (const sentence of splitSentences(block)) {
    const s = sentence.trim();
    if (s) steps.push(s);
  }
}

function stripLeadingHeading(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return text;
  const first = lines[0];
  const looksHeading =
    first.length <= 60 &&
    /^[A-Za-z][A-Za-z0-9\s\-']+$/.test(first) &&
    !/[.!?]$/.test(first);
  if (!looksHeading) return text;
  return lines.slice(1).join("\n").trim();
}

/**
 * Split on sentence endings only. Do not break on commas or mid-clause.
 * Protects common abbreviations so "e.g." / "Fig. 1" don't fake-split.
 */
function splitSentences(s) {
  let protectedText = s;
  const placeholders = [];
  const protect = (re) => {
    protectedText = protectedText.replace(re, (match) => {
      const key = `__ABBR${placeholders.length}__`;
      placeholders.push(match);
      return key;
    });
  };
  protect(/\b(?:e\.g|i\.e|etc|Fig|fig|Mr|Mrs|Ms|Dr|Prof)\./gi);
  protect(/\b[A-Z]\./g);

  const parts = protectedText.split(/(?<=[.!?])\s+(?=[A-Z"'(0-9])/).filter(Boolean);
  return parts.map((part) => {
    let out = part.trim();
    placeholders.forEach((val, idx) => {
      out = out.replace(`__ABBR${idx}__`, val);
    });
    return out;
  }).filter(Boolean);
}
