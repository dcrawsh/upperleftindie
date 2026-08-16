import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy raw tokens. Still referenced by the private /admin console.
        ink: "#101014",
        paper: "#fffdf6",
        clay: "#b45f3a",
        gold: "#d8a648",

        // Semantic surfaces
        page: "#fffdf6",
        surface: "#ffffff",
        sunken: "#f3efe2",
        inverse: "#101014",
        "accent-soft": "#f6e7df",

        // Semantic text
        primary: "#101014",
        secondary: "#4c4b4d",
        tertiary: "#646363",
        "on-inverse": "#fffdf6",
        accent: "#8f4526",

        // Accent fills (large areas only — never small text)
        "accent-solid": "#b45f3a",
        "accent-hover": "#8f4526",

        // Borders
        subtle: "#dfd9c9",
        strong: "#8b8a87",

        // Feedback
        focus: "#1d4ed8",
        error: "#a02622",
        success: "#2f5d3a",
      },
      fontFamily: {
        sans: ["var(--font-text)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-text)", "sans-serif"],
      },
      borderRadius: {
        field: "6px",
        card: "10px",
        panel: "16px",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16, 16, 20, 0.12)",
        raised: "0 2px 8px rgba(15, 15, 20, 0.08)",
        overlay: "0 24px 60px rgba(15, 15, 20, 0.28)",
      },
      maxWidth: {
        content: "1200px",
        measure: "68ch",
      },
    },
  },
  plugins: [],
} satisfies Config;
