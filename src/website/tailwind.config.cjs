/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        blue: {
          50: "#eef3ff",
          100: "#d9e4ff",
          200: "#bcd0ff",
          300: "#8eb3ff",
          400: "#5989ff",
          500: "#3863ff",
          600: "#1b3bf5",
          700: "#1428e1",
          800: "#1722b6",
          900: "#19248f",
          950: "#141857"
        }
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "3rem",
        "6xl": "5rem"
      }
    }
  },
  plugins: []
};
