import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Además de VITE_*, se exponen al navegador las variables WHATSAPP_* (p. ej. WHATSAPP_NUMBER,
  // configurada en Vercel). Solo datos públicos: acaban dentro del JavaScript de la web.
  envPrefix: ['VITE_', 'WHATSAPP_'],
})
