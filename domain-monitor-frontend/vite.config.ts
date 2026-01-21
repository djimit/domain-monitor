import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        // Enable SSL verification - only allow insecure in development with localhost
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});
