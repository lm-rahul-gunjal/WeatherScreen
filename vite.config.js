import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    basicSsl(),
  ],
  server: {
    host: true,
    https: true,
    proxy: {
      "/api": {
        target: "https://weather.visualcrossing.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      },
       "/geo": {
    target: "https://nominatim.openstreetmap.org",
    changeOrigin: true,
    secure: true,
    rewrite: path => path.replace(/^\/geo/, "")
  }
    }
  }
})
