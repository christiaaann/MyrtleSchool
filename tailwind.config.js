/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    screens: {
      phone: "400px",     // small mobile
      phablet: "550px",   // medium mobile
      tablet: "768px",    // normal tablet
      laptop: "1024px",   // laptop
      desktop: "1280px",  // large screens
      widescreen: "1536px"// very large
    },
    fontFamily: {
      baloo: ['"Baloo 2"', 'cursive'],
    },
    extend: {
      colors: {
        primary: "#7c0a02",
        secondary: "#111827"
      },
    },
  },
  plugins: [],
}
