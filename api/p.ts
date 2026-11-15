// Página del pedido para el enlace del mensaje de WhatsApp: /p?l=90&b=7285&f=7928
// (vercel.json reescribe /p → /api/p).
// - A WhatsApp le da las etiquetas Open Graph con la imagen de la bufanda (vista previa).
// - A las personas las lleva a la web con ese pedido cargado.

import { findColor, FRINGE_PRICE_EUR, LENGTHS } from '../src/data/options.js'
import { orderQuery, parseOrder } from '../src/scarf/order.js'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function GET(request: Request): Response {
  const url = new URL(request.url)
  const order = parseOrder(url.searchParams)
  if (!order) return Response.redirect(new URL('/', url), 302)

  const length = LENGTHS.find((l) => l.id === order.lengthId)!
  const base = findColor(order.baseColorId)!
  const fringe = findColor(order.fringeColorId)
  const price = length.price + (fringe ? FRINGE_PRICE_EUR : 0)

  const query = orderQuery(order)
  const app = `${url.origin}/?${query}`
  const image = `${url.origin}/api/og?${query}`
  const title = `Bufanda de ${length.label} · Base ${base.name} · ${fringe ? `Flecos ${fringe.name}` : 'Sin flecos'}`
  const description = `${price}€ · Bufandas Safi, handmade ©1991`

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bufandas Safi">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(`${url.origin}/p?${query}`)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="640">
<meta property="og:image:height" content="336">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${esc(app)}">
</head>
<body>
<script>location.replace(${JSON.stringify(app)})</script>
<a href="${esc(app)}">${esc(title)}</a>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
