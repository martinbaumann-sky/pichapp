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
          DEFAULT: "#006989",
          600: "#005570",
          700: "#003f52",
          light: "#2d8ea8",
        },
        accent: {
          DEFAULT: "#2d8ea8",
          50: "#e0f1f6",
          100: "#c7e4ee",
          200: "#9ecedf",
          600: "#1f6f84",
        },
        bg: {
          DEFAULT: "#eaebed",
          subtle: "#f4f5f7",
          card: "#fdfdfe",
        },
        fg: {
          DEFAULT: "#0f2a32",
          muted: "#45606d",
        },
        border: "#c9d3d9",
        ring: "#006989",
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
