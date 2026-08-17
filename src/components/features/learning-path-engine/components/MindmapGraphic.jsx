"use client";

/**
 * Always-on mindmap graphic from teacher summary JSON (no external AI image needed).
 */
export default function MindmapGraphic({ summary, title = "Summary" }) {
  const branches = Array.isArray(summary?.branches) ? summary.branches.slice(0, 6) : [];
  const headline = summary?.headline || "";
  const mainTitle = summary?.title || title;

  if (!branches.length) {
    return null;
  }

  const n = branches.length;
  const cx = 200;
  const cy = 200;
  const r = 118;

  const nodes = branches.map((b, i) => {
    const ang = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    return { ...b, x, y };
  });

  return (
    <div className="mindmap">
      <svg
        className="mindmap__svg"
        viewBox="0 0 400 400"
        role="img"
        aria-label={mainTitle || "Lesson mindmap"}
      >
        <defs>
          <radialGradient id="mmHub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00A8E8" />
            <stop offset="100%" stopColor="#0086B8" />
          </radialGradient>
          <filter id="mmShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
        <rect width="400" height="400" rx="18" fill="#F8F9FA" />

        {nodes.map((node, i) => (
          <g key={node.id || i}>
            <line
              x1={cx}
              y1={cy}
              x2={node.x}
              y2={node.y}
              stroke="#E9ECEF"
              strokeWidth="3"
            />
            <line
              x1={cx}
              y1={cy}
              x2={node.x}
              y2={node.y}
              stroke="#00A8E8"
              strokeWidth="1.5"
              strokeOpacity="0.45"
            />
          </g>
        ))}

        <circle cx={cx} cy={cy} r="46" fill="url(#mmHub)" filter="url(#mmShadow)" />
        <foreignObject x={cx - 40} y={cy - 28} width="80" height="56">
          <div xmlns="http://www.w3.org/1999/xhtml" className="mindmap__hub-text">
            {mainTitle}
          </div>
        </foreignObject>

        {nodes.map((node, i) => {
          const w = 92;
          const h = 48;
          return (
            <g key={`n-${node.id || i}`} filter="url(#mmShadow)">
              <rect
                x={node.x - w / 2}
                y={node.y - h / 2}
                width={w}
                height={h}
                rx="12"
                fill="#fff"
                stroke="#E9ECEF"
                strokeWidth="2"
              />
              <foreignObject x={node.x - w / 2 + 4} y={node.y - h / 2 + 4} width={w - 8} height={h - 8}>
                <div xmlns="http://www.w3.org/1999/xhtml" className="mindmap__node-text">
                  {node.label}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
      {headline ? <p className="mindmap__headline">{headline}</p> : null}
    </div>
  );
}
