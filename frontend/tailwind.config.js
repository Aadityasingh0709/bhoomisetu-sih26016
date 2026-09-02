/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#eef2f6",
          100: "#d7e0ea",
          300: "#8fa3ba",
          500: "#3d5a78",
          700: "#1c3552",
          900: "#0f2138",
          950: "#0a1626",
        },
        ochre: {
          400: "#d99a3f",
          500: "#c17817",
          600: "#a3630f",
        },
        status: {
          onTrack: "#1c7a4d",
          atRisk: "#c17817",
          delayed: "#b6412c",
          completed: "#2f5f8a",
        },
      },
      fontFamily: {
        sans: ["'Public Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
