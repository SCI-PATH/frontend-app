"use client";

import { FlaskConical, Star, Zap } from "lucide-react";

/**
 * Fun-fact style floating dots + icons for lesson / explore backgrounds.
 */
export default function LessonStageAmbiance() {
  const colors = ["#00a8e8", "#ff6b35", "#7209b7", "#70e000", "#ffb703", "#ff4d8d"];
  const dots = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    top: `${(i * 17 + 7) % 92}%`,
    left: `${(i * 29 + 5) % 94}%`,
    size: 5 + (i % 5) * 2,
    color: colors[i % colors.length],
    delay: `${(i % 8) * 0.35}s`,
    duration: `${2.8 + (i % 5) * 0.45}s`,
  }));
  const icons = [
    { id: "zap", Icon: Zap, className: "lesson-stage__ambiance-float--zap", top: "12%", left: "8%" },
    { id: "flask", Icon: FlaskConical, className: "lesson-stage__ambiance-float--flask", top: "18%", left: "78%" },
    { id: "star", Icon: Star, className: "lesson-stage__ambiance-float--star", top: "72%", left: "82%" },
    { id: "zap2", Icon: Zap, className: "lesson-stage__ambiance-float--zap", top: "58%", left: "6%" },
    { id: "flask2", Icon: FlaskConical, className: "lesson-stage__ambiance-float--flask", top: "38%", left: "88%" },
    { id: "star2", Icon: Star, className: "lesson-stage__ambiance-float--star", top: "86%", left: "18%" },
  ];

  return (
    <div className="lesson-stage__ambiance" aria-hidden>
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="lesson-stage__ambiance-dot"
          style={{
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            background: dot.color,
            animationDelay: dot.delay,
            animationDuration: dot.duration,
          }}
        />
      ))}
      {icons.map(({ id, Icon, className, top, left }, index) => (
        <div
          key={id}
          className={`lesson-stage__ambiance-float ${className}`}
          style={{ top, left, animationDelay: `${index * 0.45}s` }}
        >
          <Icon size={16} aria-hidden />
        </div>
      ))}
      <span className="lesson-stage__ambiance-wow" style={{ top: "8%", left: "62%" }}>
        wow!
      </span>
      <span className="lesson-stage__ambiance-wow lesson-stage__ambiance-wow--alt" style={{ top: "78%", left: "48%" }}>
        wow!
      </span>
    </div>
  );
}
