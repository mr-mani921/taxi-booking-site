export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#031d49", // Keep the primary color as requested
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
          accent1: "#4285F4", // Added accent color 1
          accent2: "#34A853", // Added accent color 2
          accent3: "#FBBC05", // Added accent color 3
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
        card: "0 10px 20px rgba(0, 0, 0, 0.05), 0 6px 6px rgba(0, 0, 0, 0.03)",
        "card-hover":
          "0 15px 30px rgba(0, 0, 0, 0.1), 0 8px 10px rgba(0, 0, 0, 0.08)",
        subtle: "0 2px 4px rgba(0, 0, 0, 0.04)",
        input: "0 1px 3px rgba(0, 0, 0, 0.08)",
        "input-focus": "0 0 0 3px rgba(3, 29, 73, 0.15)",
        button:
          "0 4px 6px rgba(3, 29, 73, 0.12), 0 1px 3px rgba(3, 29, 73, 0.08)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      transitionDuration: {
        250: "250ms",
        400: "400ms",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
