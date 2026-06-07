/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d1810",
        milk: "#f7f4ee",
        cream: "#f1ebdf",
        line: "#e4ddcf",
        ash: "#7c7264",
        coral: "#ff6b5c",
        orange: "#ef7a30",
        "orange-deep": "#db6920",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
