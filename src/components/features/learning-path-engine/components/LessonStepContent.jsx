/**
 * Renders one lesson card with highlighted science vocabulary.
 */
export default function LessonStepContent({ text, density = "stepped" }) {
  if (!text?.trim()) return null;

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
