import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Relative asset paths, so the build works under /tetris/ on GitHub Pages.
  base: './',
  plugins: [react(), tailwindcss()],
})
