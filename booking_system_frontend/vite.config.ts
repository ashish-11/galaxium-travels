import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Vite automatically handles SCSS with the sass package installed
export default defineConfig({
  plugins: [react()],
})
