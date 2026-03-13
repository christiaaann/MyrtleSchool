/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    screens: {
      mini: "300px",
      phone: "400px",
      phablet: "550px",
      tablet: "768px",
      laptop: "1024px",
      desktop: "1280px",
      widescreen: "1536px"
    },
    fontFamily: {
      baloo: ['"Baloo 2"', 'cursive'],
    },
    extend: {
      colors: {
        primary: "#7c0a02",
        secondary: "#111827"
      },
     
      keyframes: {
        smoothBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }, 
        },
      },
      animation: {
        smoothBounce: 'smoothBounce 3s ease-in-out infinite', 
      },
    },
  },
  plugins: [],
}