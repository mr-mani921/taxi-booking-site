import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows external access
    port: 5173, // Make sure this matches your ngrok command
    strictPort: true, // Ensures Vite runs on the exact port
    cors: true, // Enables CORS
  },
  build: {
    outDir: "dist",
    minify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
