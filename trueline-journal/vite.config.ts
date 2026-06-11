import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// '@fable' points at the JS emitted by `dotnet fable` (see package.json
// scripts) — run `npm run fable:build` once before vite if it's missing.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@fable': path.resolve(__dirname, 'src/fsharp/build/src/fsharp'),
    },
  },
  server: {
    port: 5173,
  },
})
