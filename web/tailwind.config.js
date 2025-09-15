/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#06b6d4", // cyan-500
          600: "#0891b2",
          700: "#0e7490",
        },
        accent: {
          DEFAULT: "#0b8f3d", // cancha green
          600: "#0a7a37",
          700: "#096a31",
        },
        bg: {
          DEFAULT: "#ffffff",
          subtle: "#f8fafc",
          card: "#ffffff",
        },
        fg: {
          DEFAULT: "#0f172a",
          muted: "#475569",
        },
        border: "#e5e7eb",
        ring: "#0f172a",
      },
      borderRadius: {
        xl: "0.875rem",
        '2xl': "1rem",
        blob: "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(15, 23, 42, 0.06)",
        focus: "0 0 0 4px rgba(15, 23, 42, 0.12)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in-from-bottom": "slideInFromBottom 0.5s ease-out",
        "zoom-in": "zoomIn 0.3s ease-out",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInFromBottom: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        zoomIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
