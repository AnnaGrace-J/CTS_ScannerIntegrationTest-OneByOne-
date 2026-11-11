import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ace: {
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
          text: "#172033",
          muted: "#667085"
        },
        cts: {
          teal: "#0F2A44",
          blue: "#1E4E79",
          navy: "#0F2A44",
          line: "#D8DEE6",
          row: "#F8FAFC",
          disabled: "#EEF2F6"
        }
      },
      boxShadow: {
        enterprise: "0 1px 2px rgba(15, 35, 55, 0.12)",
        ace: "0 12px 32px rgba(15, 42, 68, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
