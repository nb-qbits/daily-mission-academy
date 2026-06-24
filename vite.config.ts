import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // IMPORTANT: this must match your GitHub repository name exactly,
  // including the leading and trailing slashes.
  // If you rename the repo, update this value to match.
  base: '/daily-mission-academy/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
