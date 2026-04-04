export const cyberpunkTheme = {
  colors: {
    background: "#0a0a0f",
    foreground: "#e0e0e0",
    card: "#12121a",
    muted: "#1c1c2e",
    mutedForeground: "#6b7280",
    accent: "#00ff88",
    accentSecondary: "#ff00ff",
    accentTertiary: "#00d4ff",
    border: "#2a2a3a",
    input: "#12121a",
    ring: "#00ff88",
    destructive: "#ff3366",
  },
  shadows: {
    neon: "0 0 5px #00ff88, 0 0 10px #00ff8840",
    neonSm: "0 0 3px #00ff88, 0 0 6px #00ff8830",
    neonLg: "0 0 10px #00ff88, 0 0 20px #00ff8860, 0 0 40px #00ff8830",
    neonSecondary: "0 0 5px #ff00ff, 0 0 20px #ff00ff60",
    neonTertiary: "0 0 5px #00d4ff, 0 0 20px #00d4ff60",
  },
};

export const cyberCardStyle = {
  background: cyberpunkTheme.colors.card,
  border: `1px solid ${cyberpunkTheme.colors.border}`,
};

export const cyberInputStyle = {
  background: cyberpunkTheme.colors.input,
  border: `1px solid ${cyberpunkTheme.colors.border}`,
  color: cyberpunkTheme.colors.foreground,
};
