const FARM_BOY_SRC = "/learning-path/farmboy.jpg";

export default function TutorMascot({ celebrate = false, size = "lg", className = "" }) {
  return (
    <div
      className={`tutor-mascot tutor-mascot--farm size-${size}${celebrate ? " is-celebrating" : ""}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label="Arthur, your science guide"
    >
      <div className="tutor-mascot__frame">
        <img
          className="tutor-mascot__photo"
          src={FARM_BOY_SRC}
          alt=""
          draggable={false}
        />
      </div>
      {celebrate ? (
        <span className="tutor-mascot__sparkles" aria-hidden>
          ✦
        </span>
      ) : null}
    </div>
  );
}
