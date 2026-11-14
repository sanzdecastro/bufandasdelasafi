// Imagen del pedido (PNG 1200 × 630) para la vista previa del enlace en WhatsApp.
// GET /api/og?l=90&b=7285&f=7928
// La bufanda se dibuja con la misma geometría que en la web y sobre el fondo pastel del tema.

import { Resvg } from '@resvg/resvg-js'
import { findColor, LENGTHS, RIBS_PER_90CM } from '../src/data/options'
import { computeTheme } from '../src/composables/useTheme'
import { scarfSize, scarfSvg } from '../src/scarf/geometry'
import { parseOrder } from '../src/scarf/order'

const W = 1200
const H = 630
const MARGIN_X = 60

export function GET(request: Request): Response {
  const order = parseOrder(new URL(request.url).searchParams)
  if (!order) return new Response('Pedido no válido', { status: 400 })

  const length = LENGTHS.find((l) => l.id === order.lengthId)!
  const base = findColor(order.baseColorId)!
  const fringe = findColor(order.fringeColorId)
  const ribs = Math.round((RIBS_PER_90CM * length.cm) / 90)
  const theme = computeTheme(base.fill, fringe?.fill ?? null)

  // Bufanda escalada al ancho de la imagen y centrada
  const size = scarfSize(ribs, !!fringe)
  const scale = Math.min((W - MARGIN_X * 2) / size.width, (H * 0.7) / size.height)
  const w = size.width * scale
  const h = size.height * scale
  // Se sustituye la etiqueta de apertura para colocar y escalar la bufanda dentro de la imagen
  const scarf = scarfSvg(base, fringe, ribs).replace(
    /^<svg[^>]*>/,
    `<svg x="${(W - w) / 2}" y="${(H - h) / 2}" width="${w}" height="${h}" viewBox="0 0 ${size.width} ${size.height}">`,
  )

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>${scarf}</svg>`

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // El mismo pedido da siempre la misma imagen
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
