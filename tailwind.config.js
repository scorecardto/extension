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
