export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#031d49", // Minicabit orange
        secondary: "#0066CC", // Minicabit blue
        dark: "#121212", // Keep for reference but will be replaced in components
        charcoal: "#1E1E1E", // Keep for reference but will be replaced
        lightGray: "#F5F5F5",
        light: "#FFFFFF",
        lightBg: "#F8F9FA",
        minicabit: {
          orange: "#031d49",
          blue: "#0066CC",
          darkBlue: "#003366",
          lightGray: "#F5F5F5",
          gray: "#6C757D",
          darkGray: "#343A40", 
          green: "#28A745",
          red: "#DC3545",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        "hero-pattern":
          "linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url('/src/assets/city-taxi.jpg')",
      },
      boxShadow: {
        minicabit: "0 4px 6px rgba(0, 0, 0, 0.1)",
        "minicabit-hover":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
