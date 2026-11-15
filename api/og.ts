// Imagen del pedido (PNG 640 × 336, proporción 1.91:1) para la vista previa del enlace en
// WhatsApp. Tamaño contenido: WhatsApp no siempre muestra imágenes de más de ~300 KB.
// GET /api/og?l=90&b=7285&f=7928
// La bufanda es la misma foto teñida que en la web (src/scarf/photo.ts), sobre el fondo pastel
// del tema de esa combinación.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { LENGTHS, findColor } from '../src/data/options.js'
import { computeTheme } from '../src/composables/useTheme.js'
import { PHOTO_H, scarfLayout, scarfPhotoSvg } from '../src/scarf/photo.js'
import { parseOrder } from '../src/scarf/order.js'

const W = 640
const H = 336
/** Escala de la foto: la bufanda ocupa ~70 % del alto, como en la web */
const SCALE = 0.48
/** Margen a la izquierda de los flecos */
const LEFT = 38
/** En la foto: dónde empiezan los flecos, dónde empieza el cuerpo y su centro vertical */
const FRINGE_X = 90
const BODY_X = 290
const BODY_CY = 392

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

  // Bufanda entera, a la misma escala que en la web: los flecos a la izquierda y el cuerpo
  // saliendo por la derecha (sin el corte de la foto)
  const lengthCm = LENGTHS.find((l) => l.id === order.lengthId)!.cm
  const { width } = scarfLayout(lengthCm)
  const scarf = scarfPhotoSvg({
    base: base.fill,
    fringe: fringe?.fill ?? null,
    bodyHref: BODY,
    fringeHref: FRINGE,
    shadow: theme.brand,
    lengthCm,
  })
  // Dos pasadas: resvg falla si un filtro se sale del lienzo, así que la bufanda se pinta
  // entera en su propio PNG y luego se coloca (sobresaliendo) sobre el fondo
  const scarfPng = new Resvg(scarf, { fitTo: { mode: 'width', value: Math.round(width * SCALE) } })
    .render()
    .asPng()
  const photo =
    `<image href="data:image/png;base64,${Buffer.from(scarfPng).toString('base64')}" ` +
    `x="${LEFT - (fringe ? FRINGE_X : BODY_X) * SCALE}" y="${H / 2 - BODY_CY * SCALE}" ` +
    `width="${width * SCALE}" height="${PHOTO_H * SCALE}"/>`

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
