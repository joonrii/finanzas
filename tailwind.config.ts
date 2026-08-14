import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0D10",
        surface: "#16191D",
        surface2: "#1D2126",
        border: "#262B31",
        muted: "#8B939C",
        positive: "#3ECF8E",
        negative: "#E5484D",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
