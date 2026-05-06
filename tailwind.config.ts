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
        ink: "#101014",
        paper: "#fffdf6",
        moss: "#52634a",
        clay: "#b45f3a",
        gold: "#d8a648",
        night: "#1d2430",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16, 16, 20, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
