/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif Thai"', '"IBM Plex Serif"', "Georgia", "serif"],
        sans: ['"Sarabun"', '"IBM Plex Sans Thai"', "system-ui", "sans-serif"],
        display: ['"Noto Serif Thai"', '"Playfair Display"', "Georgia", "serif"],
      },
      colors: {
        paper: {
          50: "#fbf5e6",
          100: "#f7ecd2",
          200: "#efdeb8",
          300: "#e5cd9a",
          400: "#d6b679",
        },
        ink: {
          DEFAULT: "#3a2a1a",
          soft: "#5a4530",
          muted: "#8b7355",
        },
        cover: {
          DEFAULT: "#1f1410",
          accent: "#a8824e",
          gold: "#c9a66b",
        },
      },
      boxShadow: {
        page: "inset 0 0 60px rgba(80,50,20,0.18)",
        book: "0 30px 60px -15px rgba(0,0,0,0.5), 0 15px 30px -10px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};
