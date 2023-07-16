import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import fs from "node:fs/promises"

export default defineConfig({
  plugins: [react()],
  define: {
    '__PACKAGE_CONTAINER_JSON__': JSON.stringify({
      'package.json': {
        file: {
          contents: (await fs.readFile("./webcontainer/package.json", "utf-8")).toString()
        }
      },
      'package-lock.json': {
        file: {
          contents: (await fs.readFile("./webcontainer/package-lock.json", "utf-8")).toString()
        }
      }
    })
    // TODO: Maybe passing a lock file would make things install faster?
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  }
});
