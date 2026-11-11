/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./Components/**/*.razor",
    "./Components/**/*.html",
    "./wwwroot/**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["SF Pro Text", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", "Helvetica Neue", "Segoe UI", "sans-serif"]
      }
    },
  },
  plugins: [],
}

