import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB", // Primary Accent from Image 1 & 2
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        tealAccent: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          500: "#14B8A6",
          600: "#0D9488", // Vibrant MediWell CTA
          700: "#0F766E",
        },
        coral: {
          50: "#FFF7ED",
          500: "#F97316",
          600: "#EA580C",
        },
        navy: {
          600: "#1A4A8F",
          700: "#123C7A",
          800: "#0E2F63", // Public site headings & dark bands
          900: "#0A2149",
          950: "#06152F",
        },
        mint: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981", // "Available" badge
          600: "#059669",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        xs: "0 1px 3px rgba(0, 0, 0, 0.06)",
        subtle: "0 2px 12px rgba(0, 0, 0, 0.03)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        float: "0 24px 60px -20px rgba(14, 47, 99, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;

