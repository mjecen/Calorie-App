/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#eef3f7",
        panel: "#f7f8fd",
        ink: "#121923",
        muted: "#4e5a66",
        line: "#d8dee8",
        calorie: "#3c9a6c",
        protein: "#075e6d"
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.08), 0 3px 8px rgba(15, 23, 42, 0.04)",
        fab: "0 8px 18px rgba(24, 95, 69, 0.28)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
