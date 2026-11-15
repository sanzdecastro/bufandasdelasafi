import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { COPY } from './src/data/copy.ts'

/**
 * Etiquetas para compartir la portada (WhatsApp, redes): título, descripción e imagen.
 * La imagen es la misma que la de los pedidos (api/og) con la combinación de Figma
 * (base 7292, flecos 7106). WhatsApp necesita la URL completa: se toma del dominio de
 * producción que Vercel expone al compilar (o de SITE_URL si se define a mano).
 */
function shareMeta(): Plugin {
  const site =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '')
  const image = `${site}/api/og?l=90&b=7292&f=7106`
  const esc = (s: string) =>
    s.replace(/\s*\n\s*/g, ' ').replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  const title = 'Bufandas Safi'
  const tags = [
    `<meta name="description" content="${esc(COPY.intro)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${title}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${esc(COPY.intro)}" />`,
    ...(site ? [`<meta property="og:url" content="${site}/" />`] : []),
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="640" />`,
    `<meta property="og:image:height" content="336" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ]
  return {
    name: 'share-meta',
    transformIndexHtml: (html) => html.replace('</title>', `</title>\n    ${tags.join('\n    ')}`),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), shareMeta()],
  // Además de VITE_*, se exponen al navegador las variables WHATSAPP_* (p. ej. WHATSAPP_NUMBER,
  // configurada en Vercel). Solo datos públicos: acaban dentro del JavaScript de la web.
  envPrefix: ['VITE_', 'WHATSAPP_'],
})
