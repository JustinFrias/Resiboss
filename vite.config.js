import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

const currentBuildTime = Date.now()

function versionManifestPlugin() {
  return {
    name: 'version-manifest-generator',
    closeBundle() {
      try {
        const outDir = path.resolve(process.cwd(), 'dist')
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true })
        }
        const versionData = {
          version: '1.2.0',
          buildTime: currentBuildTime,
          buildDate: new Date(currentBuildTime).toISOString(),
        }
        fs.writeFileSync(path.join(outDir, 'version.json'), JSON.stringify(versionData, null, 2))
      } catch (err) {
        console.warn('Failed to write version.json:', err)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_TIME__: JSON.stringify(currentBuildTime),
    __APP_VERSION__: JSON.stringify('1.2.0'),
  },
  plugins: [react(), versionManifestPlugin()],
  server: {
    host: true, // Listen on all local IP addresses (0.0.0.0)
    port: 3000, // Changed from 5173 to 3000
  },
})
