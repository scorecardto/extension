const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./page/**/*.{js,jsx,ts,tsx}", "./page/index.html"],
  theme: {
    fontFamily: {
      sans: ["DMSans", "sans-serif"],
    },
    extend: {
      colors: {
        accent: {
          100: "#f1f6ff",
          200: "#dee9ff",
          300: "#5682e9",
          400: "#426ac6",
          500: "#4F86D9",
          600: "#7C4FB6",
        },
        mono: {
          100: "#FFFFFF",
          150: "#FAFAFA",
          175: "#F4F4F4",
          200: "#e8e8e8",
          300: "#C9C9C9",
          400: "#909090",
          500: "#333333",
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s linear",
        "slide-sm-left": "slide-sm-left 0.2s ease",
        "slide-sm-right": "slide-sm-right 0.2s ease",
        "slide-sm-up": "slide-sm-up 0.2s ease",
        "slide-sm-down": "slide-sm-down 0.2s ease",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "slide-sm-left": {
          "0%": { opacity: 0, transform: "translateX(-20px)" },
          "100%": { opacity: 1, transform: "" },
        },
        "slide-sm-right": {
          "0%": { opacity: 0, transform: "translateX(20px)" },
          "100%": { opacity: 1, transform: "" },
        },
        "slide-sm-up": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "" },
        },
        "slide-sm-down": {
          "0%": { opacity: 0, transform: "translateY(-20px)" },
          "100%": { opacity: 1, transform: "" },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addBase, theme }) {
      addBase({
        "@font-face": {
          fontFamily: "DMSans",
          fontStyle: "normal",
          fontWeight: 400,
          src: "url(font/DMSans-Regular.ttf)",
        },
      });

      addBase({
        "@font-face": {
          fontFamily: "DMSans",
          fontStyle: "italic",
          fontWeight: 400,
          src: "url(font/DMSans-Italic.ttf)",
        },
      });

      addBase({
        "@font-face": {
          fontFamily: "DMSans",
          fontStyle: "normal",
          fontWeight: 500,
          src: "url(font/DMSans-Medium.ttf)",
        },
      });

      addBase({
        "@font-face": {
          fontFamily: "DMSans",
          fontStyle: "italic",
          fontWeight: 500,
          src: "url(font/DMSans-MediumItalic.ttf)",
        },
      });

      addBase({
        "@font-face": {
          fontFamily: "DMSans",
          fontStyle: "normal",
          fontWeight: 700,
          src: "url(font/DMSans-Bold.ttf)",
        },
      });

      addBase({
        "@font-face": {
          fontFamily: "DMSans",
          fontStyle: "italic",
          fontWeight: 700,
          src: "url(font/DMSans-BoldItalic.ttf)",
        },
      });
    }),
  ],
};
