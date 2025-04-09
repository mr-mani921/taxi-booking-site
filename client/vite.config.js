import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Allows external access
    port: 5173,  // Make sure this matches your ngrok command
    strictPort: true, // Ensures Vite runs on the exact port
    allowedHosts: ["ab99-61-5-153-161.ngrok-free.app"], // Replace with your ngrok host
    cors: true,  // Enables CORS
  },
})
