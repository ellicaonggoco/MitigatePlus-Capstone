import React from "react";

const stylesByType = {
  Flood: {
    color: "#1565c0",
    gradient: "from-sky-300 via-blue-500 to-blue-900",
    glow: "shadow-blue-500/30",
    path: (
      <>
        <path d="M3 15.5c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4 2-1.4 4-1.4" />
        <path d="M3 20c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4 2-1.4 4-1.4" />
        <path d="M7.5 11.5a4.5 4.5 0 0 1 9 0" />
      </>
    ),
  },
  Fire: {
    color: "#e65100",
    gradient: "from-yellow-300 via-orange-500 to-red-600",
    glow: "shadow-orange-500/35",
    path: (
      <>
        <path d="M12 22c4 0 7-3 7-7 0-3-2-5.1-4.2-7.2.1 2.1-1 3.7-2.4 4.6C12.8 8.9 11.3 6.2 9 4c.3 4.1-4 5.8-4 11 0 4 3 7 7 7Z" />
        <path d="M12 22c1.8 0 3.1-1.3 3.1-3 0-1.4-.8-2.4-1.8-3.2 0 1-.7 1.8-1.6 2.3.1-1.5-.7-2.7-1.8-3.8.1 2.2-1.9 3.2-1.9 4.8 0 1.6 1.3 2.9 3 2.9Z" />
      </>
    ),
  },
  Landslide: {
    color: "#795548",
    gradient: "from-amber-200 via-orange-700 to-stone-900",
    glow: "shadow-amber-900/25",
    path: (
      <>
        <path d="M3 20h18" />
        <path d="m4.5 17 6.2-10.5 4.1 6.2 2.1-3.1L21 17" />
        <circle cx="8" cy="15.5" r="1" />
        <circle cx="12" cy="18" r="1" />
        <circle cx="16" cy="16" r="1" />
      </>
    ),
  },
  "Fault Line": {
    color: "#7c3aed",
    gradient: "from-violet-300 via-indigo-500 to-slate-900",
    glow: "shadow-indigo-500/30",
    path: <path d="M13 2 4 14h7l-1 8 10-13h-7V2Z" />,
  },
  Typhoon: {
    color: "#00897b",
    gradient: "from-cyan-200 via-teal-500 to-emerald-700",
    glow: "shadow-teal-500/30",
    path: (
      <>
        <path d="M4 12a8 8 0 0 1 13.7-5.7" />
        <path d="M20 12A8 8 0 0 1 6.3 17.7" />
        <path d="M8 12a4 4 0 0 1 6.8-2.8" />
        <path d="M16 12a4 4 0 0 1-6.8 2.8" />
      </>
    ),
  },
  "Drainage Issue": {
    color: "#43a047",
    gradient: "from-emerald-200 via-green-500 to-lime-700",
    glow: "shadow-green-500/25",
    path: (
      <>
        <path d="M4 7h16" />
        <path d="M6 7v11h12V7" />
        <path d="M9 11h6" />
        <path d="M9 15h6" />
      </>
    ),
  },
  "Structural Damage": {
    color: "#64748b",
    gradient: "from-slate-200 via-slate-500 to-slate-800",
    glow: "shadow-slate-500/25",
    path: (
      <>
        <path d="M4 20h16" />
        <path d="M6 20V8l6-4 6 4v12" />
        <path d="m10 8 2 4-2 2 2 3" />
        <path d="M14 8h2" />
      </>
    ),
  },
};

const fallback = {
  color: "#1565c0",
  gradient: "from-blue-400 via-blue-600 to-navy-900",
  glow: "shadow-blue-500/25",
  path: (
    <>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </>
  ),
};

const hazardEmojis = {
  Flood: "🌊",
  Fire: "🔥",
  Landslide: "⛰️",
  "Fault Line": "⚡",
  Typhoon: "🌪️",
  "Drainage Issue": "🚧",
  "Structural Damage": "🏚️",
};

Object.assign(hazardEmojis, {
  Flood: "\u{1F30A}",
  Fire: "\u{1F525}",
  Landslide: "\u{26F0}\u{FE0F}",
  "Fault Line": "\u{26A1}",
  Typhoon: "\u{1F32A}\u{FE0F}",
  "Drainage Issue": "\u{1F6A7}",
  "Structural Damage": "\u{1F3DA}\u{FE0F}",
});

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-14 h-14",
};

const HazardIconBadge = ({ type, size = "md", className = "" }) => {
  const config = stylesByType[type] || fallback;

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} relative flex items-center justify-center ${className}`}
      title={type || "Hazard"}
    >
      <span
        className="relative z-10 text-[1.7rem] leading-none"
        style={{
          textShadow: `-2px 0 ${config.color}, 2px 0 ${config.color}, 0 -2px ${config.color}, 0 2px ${config.color}, 0 3px 5px rgba(0,0,0,0.35)`,
        }}
        aria-hidden="true"
      >
        {hazardEmojis[type] || "⚠️"}
      </span>
    </div>
  );
};

export default HazardIconBadge;
