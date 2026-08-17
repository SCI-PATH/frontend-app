/** Self-contained illustrated guide; no external sprite asset is required. */
export default function TutorMascot({ celebrate = false }) {
  return (
    <div
      className={`tutor-mascot tutor-mascot--teach${celebrate ? " is-celebrating" : ""}`}
      role="img"
      aria-label="Sir Arthur, your science guide"
    >
      <svg className="tutor-mascot__art" viewBox="0 0 160 180" aria-hidden="true">
        <defs>
          <linearGradient id="arthurArmor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="arthurCape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#5b21b6" />
          </linearGradient>
        </defs>
        <ellipse cx="80" cy="168" rx="45" ry="8" fill="#312e81" opacity=".15" />
        <path d="M39 89 Q21 120 31 156 L60 145 L55 92Z" fill="url(#arthurCape)" />
        <path d="M121 89 Q139 120 129 156 L100 145 L105 92Z" fill="url(#arthurCape)" />
        <rect x="55" y="82" width="50" height="67" rx="20" fill="url(#arthurArmor)" stroke="#64748b" strokeWidth="3" />
        <path d="M65 96 H95 V128 Q80 145 65 128Z" fill="#fff" stroke="#f59e0b" strokeWidth="3" />
        <path d="M80 101 L87 114 L80 127 L73 114Z" fill="#f59e0b" />
        <circle cx="80" cy="61" r="32" fill="#f4c89b" stroke="#713f12" strokeWidth="3" />
        <path d="M51 63 Q50 25 80 20 Q110 25 109 63 L99 53 Q80 42 61 53Z" fill="url(#arthurArmor)" stroke="#64748b" strokeWidth="3" />
        <path d="M48 55 H112 V68 H48Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="3" />
        <rect x="59" y="58" width="42" height="6" rx="3" fill="#334155" />
        <circle cx="69" cy="75" r="3" fill="#334155" />
        <circle cx="91" cy="75" r="3" fill="#334155" />
        <path d="M72 85 Q80 91 88 85" fill="none" stroke="#9a3412" strokeWidth="3" strokeLinecap="round" />
        <path d="M55 104 Q35 110 31 129" fill="none" stroke="#94a3b8" strokeWidth="13" strokeLinecap="round" />
        <circle cx="29" cy="133" r="8" fill="#f4c89b" stroke="#713f12" strokeWidth="2" />
        <path d="M105 104 Q129 98 137 77" fill="none" stroke="#94a3b8" strokeWidth="13" strokeLinecap="round" />
        <circle cx="138" cy="72" r="8" fill="#f4c89b" stroke="#713f12" strokeWidth="2" />
        <path d="M61 145 L56 164 H73 L76 145 M99 145 L104 164 H87 L84 145" fill="#64748b" stroke="#475569" strokeWidth="3" />
        {celebrate ? (
          <>
            <circle cx="26" cy="42" r="5" fill="#fb5607" />
            <path d="M125 35 l8 -8 M129 43 h12 M35 30 l-7 -8" stroke="#ffb703" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : null}
      </svg>
    </div>
  );
}
