export const aceTokens = {
  color: {
    primary: "#0F2A44",
    primaryLight: "#1E4E79",
    accent: "#0E9488",
    success: "#15803D",
    warning: "#B45309",
    danger: "#B91C1C",
    info: "#2563EB",
    background: "#F5F7FA",
    surface: "#FFFFFF",
    border: "#D8DEE6",
    textPrimary: "#172033",
    textSecondary: "#667085"
  },
  radius: {
    panel: "0.75rem",
    control: "0.375rem",
    compact: "0.5rem"
  },
  shadow: {
    panel: "0 1px 2px rgba(15, 35, 55, 0.12)",
    elevated: "0 12px 32px rgba(15, 42, 68, 0.08)"
  },
  density: {
    compact: {
      panelPadding: "0.75rem",
      controlHeight: "2rem"
    },
    comfortable: {
      panelPadding: "1rem",
      controlHeight: "2.25rem"
    }
  }
} as const;

export type AceDensity = keyof typeof aceTokens.density;
