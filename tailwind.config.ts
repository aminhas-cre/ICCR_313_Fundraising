import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: "#0f4a3c",
          dark: "#0a3329",
          light: "#1c6b57",
        },
        sand: {
          DEFAULT: "#f6f1e7",
          dark: "#ece3d1",
        },
        gold: {
          DEFAULT: "#b8925a",
          light: "#d6b78a",
          // Darker variant for text on light backgrounds. #b8925a only hits
          // 2.56:1 on the sand background, well under WCAG AA; this hits 5.6:1.
          ink: "#7a5a30",
        },
        ink: "#1c2420",
      },
      fontFamily: {
        serif: ["var(--font-heading)", "Georgia", "Cambria", "serif"],
        sans: ["var(--font-body)", "-apple-system", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
