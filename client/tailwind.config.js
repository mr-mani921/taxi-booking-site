export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FFC107",
        dark: "#121212",
        charcoal: "#1E1E1E",
        lightGray: "#E0E0E0"
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'hero-pattern': "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/src/assets/city-night.jpg')"
      }
    },
  },
  plugins: [],
}