// Imagen del pedido (PNG 800 × 420, proporción 1.91:1) para la vista previa del enlace en
// WhatsApp. Tamaño contenido: WhatsApp no siempre muestra imágenes de más de ~300 KB.
// GET /api/og?l=90&b=7285&f=7928
// La bufanda es la misma foto teñida que en la web (src/scarf/photo.ts), sobre el fondo pastel
// del tema de esa combinación.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { findColor } from '../src/data/options.js'
import { computeTheme } from '../src/composables/useTheme.js'
import { PHOTO_H, PHOTO_W, scarfPhotoSvg } from '../src/scarf/photo.js'
import { parseOrder } from '../src/scarf/order.js'

const W = 800
const H = 420
const MARGIN = 20

// Capas de la foto (vercel.json las incluye en la función con includeFiles)
const layer = (name: string) =>
  `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/scarf', name)).toString('base64')}`
const BODY = layer('cuerpo.png')
const FRINGE = layer('flecos.png')

export function GET(request: Request): Response {
  const order = parseOrder(new URL(request.url).searchParams)
  if (!order) return new Response('Pedido no válido', { status: 400 })

  const base = findColor(order.baseColorId)!
  const fringe = findColor(order.fringeColorId)
  const theme = computeTheme(base.fill, fringe?.fill ?? null)

  // Foto escalada al alto de la imagen y centrada
  const h = H - MARGIN * 2
  const w = (h * PHOTO_W) / PHOTO_H
  const photo = scarfPhotoSvg({
    base: base.fill,
    fringe: fringe?.fill ?? null,
    bodyHref: BODY,
    fringeHref: FRINGE,
  }).replace(
    /^<svg[^>]*>/,
    `<svg x="${(W - w) / 2}" y="${MARGIN}" width="${w}" height="${h}" viewBox="0 0 ${PHOTO_W} ${PHOTO_H}">`,
  )

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>${photo}</svg>`

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // El mismo pedido da siempre la misma imagen
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
