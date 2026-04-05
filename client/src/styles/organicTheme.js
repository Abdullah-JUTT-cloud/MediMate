export const organicTheme = {
  colors: {
    background: "var(--color-bg)",
    foreground: "var(--color-text-primary)",
    primary: "var(--color-primary)",
    primaryForeground: "var(--color-on-primary)",
    secondary: "var(--color-secondary)",
    secondaryForeground: "var(--color-on-primary)",
    accent: "var(--color-accent)",
    accentForeground: "var(--color-text-primary)",
    muted: "var(--color-bg-soft)",
    mutedForeground: "var(--color-text-secondary)",
    border: "var(--color-border)",
    destructive: "var(--color-danger)",
    card: "var(--color-card)",
  },
  shadows: {
    soft: "var(--shadow-soft)",
    float: "var(--shadow-float)",
    deep: "0 20px 40px -10px color-mix(in srgb, var(--color-primary) 22%, transparent)",
    button: "0 6px 24px -8px color-mix(in srgb, var(--color-primary) 30%, transparent)",
  },
  radii: {
    blobA: "60% 40% 30% 70% / 60% 30% 70% 40%",
    blobB: "30% 70% 70% 30% / 30% 30% 70% 70%",
  },
};

export const organicCardStyle = {
  background: "var(--color-card)",
  border: "1px solid color-mix(in srgb, var(--color-border) 78%, transparent)",
  boxShadow: organicTheme.shadows.soft,
};

export const organicSectionStyle = {
  background: "color-mix(in srgb, var(--color-bg-soft) 54%, transparent)",
  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
};

export const organicInputStyle = {
  background: "color-mix(in srgb, var(--color-card) 84%, transparent)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-primary)",
};
