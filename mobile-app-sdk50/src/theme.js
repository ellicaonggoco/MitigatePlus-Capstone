export const colors = {
  navy: "#0d2b6b",
  navyDark: "#071a42",
  blue: "#1976d2",
  sky: "#2bb7ff",
  lightBlue: "#9bd8ff",
  aqua: "#22c7b8",
  mint: "#dff8ef",
  sunshine: "#ffc857",
  coral: "#ff6b5f",
  red: "#e53935",
  bg: "#edf7ff",
  bgWarm: "#fff8ed",
  surface: "#ffffff",
  text: "#1a1a2e",
  muted: "#64748b",
  border: "#d8eaff",
  green: "#2e9d70",
  orange: "#f59e0b",
  lavender: "#7c6cff",
};

export const fonts = {
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semiBold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
  extraBold: "Poppins-ExtraBold",
  black: "Poppins-Black",
};

export const shadow = {
  card: {
    shadowColor: "#0d2b6b",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  soft: {
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 5,
  },
  button: {
    shadowColor: "#1565c0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 6,
  },
};

export const riskColor = (level) => {
  if (level === "high") return colors.red;
  if (level === "moderate") return colors.orange;
  return colors.green;
};

export const hazardPalette = {
  Flood: { bg: "#dff3ff", color: "#0f67d8" },
  Fire: { bg: "#fff0dc", color: "#f97316" },
  Landslide: { bg: "#f3e7d8", color: "#9a5a1f" },
  "Fault Line": { bg: "#eeeaff", color: "#6d5dfc" },
  Typhoon: { bg: "#dffaf7", color: "#0ea5a4" },
  "Drainage Issue": { bg: "#e4f8ed", color: "#1f9d55" },
  "Structural Damage": { bg: "#eef3f8", color: "#475569" },
  Evacuation: { bg: "#e4f8ed", color: "#10b981" },
};

export const hazardIcons = {
  Flood: "water-outline",
  Fire: "flame-outline",
  Landslide: "trail-sign-outline",
  "Fault Line": "pulse-outline",
  Typhoon: "thunderstorm-outline",
  "Drainage Issue": "git-compare-outline",
  "Structural Damage": "business-outline",
};

export const hazardEmojis = {
  Flood: "🌊",
  Fire: "🔥",
  Landslide: "⛰️",
  "Fault Line": "⚡",
  Typhoon: "🌪️",
  "Drainage Issue": "🚧",
  "Structural Damage": "🏚️",
};

export const hazardTypes = [
  "Flood",
  "Fire",
  "Landslide",
  "Fault Line",
  "Typhoon",
  "Drainage Issue",
  "Structural Damage",
];
