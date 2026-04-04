export const organicTheme = {
  colors: {
    background: "#FDFCF8",
    foreground: "#2C2C24",
    primary: "#5D7052",
    primaryForeground: "#F3F4F1",
    secondary: "#C18C5D",
    secondaryForeground: "#FFFFFF",
    accent: "#E6DCCD",
    accentForeground: "#4A4A40",
    muted: "#F0EBE5",
    mutedForeground: "#78786C",
    border: "#DED8CF",
    destructive: "#A85448",
    card: "#FEFEFA",
  },
  shadows: {
    soft: "0 4px 20px -2px rgba(93, 112, 82, 0.15)",
    float: "0 10px 40px -10px rgba(193, 140, 93, 0.2)",
    deep: "0 20px 40px -10px rgba(93, 112, 82, 0.15)",
    button: "0 6px 24px -8px rgba(93,112,82,0.28)",
  },
  radii: {
    blobA: "60% 40% 30% 70% / 60% 30% 70% 40%",
    blobB: "30% 70% 70% 30% / 30% 30% 70% 70%",
  },
};

export const organicCardStyle = {
  background: organicTheme.colors.card,
  border: `1px solid ${organicTheme.colors.border}80`,
  boxShadow: organicTheme.shadows.soft,
};

export const organicSectionStyle = {
  background: `${organicTheme.colors.muted}44`,
  border: `1px solid ${organicTheme.colors.border}A0`,
};

export const organicInputStyle = {
  background: "rgba(255,255,255,0.55)",
  border: `1px solid ${organicTheme.colors.border}`,
  color: organicTheme.colors.foreground,
};
