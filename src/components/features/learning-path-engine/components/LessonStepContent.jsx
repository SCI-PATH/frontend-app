/**
 * Renders one lesson card with highlighted science vocabulary.
 * Basic level: merged steps show as one paragraph; other levels may split sentences visually.
 */
export default function LessonStepContent({ text, density = "stepped", profile = "basic" }) {
  if (!text?.trim()) return null;

  if (/^go deeper$/i.test(text.trim())) {
    return (
      <p className={`lesson-step__p lesson-step__p--${density} lesson-step__p--heading`}>
        Go deeper
      </p>
    );
  }

  const block = String(text || "").replace(/\s+/g, " ").trim();
  const isBasicProfile = isBasicLearnerProfile(profile);
  const sentenceParas = splitDisplaySentences(block);
  if (sentenceParas.length > 1 && !isBasicProfile) {
    return (
      <div className={`lesson-step lesson-step--${density} lesson-step--multi`}>
        {sentenceParas.map((sentence, idx) => (
          <p key={idx} className={`lesson-step__p lesson-step__p--${density}`}>
            <ColorfulText text={sentence} />
          </p>
        ))}
      </div>
    );
  }

  if (sentenceParas.length >= 1 && isBasicProfile) {
    return (
      <p className={`lesson-step__p lesson-step__p--${density} lesson-step__p--paragraph`}>
        <ColorfulText text={block} />
      </p>
    );
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const isBulletLine = (l) =>
    /^[-•\u2022]\s+/.test(l) || /^[-*]\s+/.test(l) || /^\d+[.)]\s+/.test(l);

  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBulletLine(line)) {
      const items = [];
      while (i < lines.length && isBulletLine(lines[i])) {
        items.push(
          lines[i]
            .replace(/^[-•\u2022*]\s+/, "")
            .replace(/^\d+[.)]\s+/, "")
            .trim()
        );
        i += 1;
      }
      blocks.push({ type: "ul", items });
    } else {
      const paras = [];
      while (i < lines.length && !isBulletLine(lines[i])) {
        paras.push(lines[i]);
        i += 1;
      }
      if (paras.length) blocks.push({ type: "p", text: paras.join(" ") });
    }
  }

  if (blocks.length === 0) {
    return <p className={`lesson-step__p lesson-step__p--${density}`}>{text}</p>;
  }

  return (
    <div className={`lesson-step lesson-step--${density}`}>
      {blocks.map((b, idx) =>
        b.type === "ul" ? (
          <ul key={idx} className="lesson-step__ul">
            {b.items.map((item, j) => (
              <li key={j} className="lesson-step__li">
                <ColorfulText text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={idx} className={`lesson-step__p lesson-step__p--${density}`}>
            <ColorfulText text={b.text} />
          </p>
        ),
      )}
    </div>
  );
}

const SCIENCE_WORDS =
  /\b(stems?|roots?|flowers?|fruits?|leaves?|plants?|animals?|cells?|water|energy|matter|habitats?|organisms?|photosynthesis|nutrients?|oxygen|carbon dioxide|light|soil|systems?|structures?|functions?|process(?:es)?|resources?|environment|ecosystems?|species|adaptations?|classification|characteristics?|minerals?|temperature|forces?|motion|electricity|circuits?|atoms?|molecules?|mixtures?|solutions?|digest(?:ion|ive)?|respiration|reproduction|growth)\b/gi;

function splitDisplaySentences(text) {
  const block = String(text || "").replace(/\s+/g, " ").trim();
  if (!block) return [];
  const parts = block.split(/(?<=[.!?])\s+(?=[A-Z"'(0-9])/).filter(Boolean);
  return parts.length > 1 ? parts : [block];
}

function isBasicLearnerProfile(profile) {
  const key = String(profile || "basic").toLowerCase();
  return key === "basic" || key === "weak" || key === "struggling" || key === "beginner" || key === "low";
}

function ColorfulText({ text }) {
  const parts = String(text).split(SCIENCE_WORDS);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span
        key={`${part}-${index}`}
        className={`lesson-step__term lesson-step__term--${Math.floor(index / 2) % 4}`}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}
