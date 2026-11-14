// Geometría de la bufanda (frame 3:7958 de Figma), compartida por la vista previa de la web
// (ScarfPreview.vue) y por la imagen que se genera para WhatsApp (api/og.ts).
//
// El cuerpo es un canalé: se repite el par de columnas A + B (15 px):
//   A · 10 px de ancho: 43 puntos horizontales (cápsulas de 10 × 5–6) apilados en 219 px
//   B ·  5 px de ancho: 22 puntos verticales (cápsulas de 5 × ~10) repartidos en 219 px
// Los flecos son 10 columnas tipo A con puntos alternos (lleno / hueco), sin borde.

import type { YarnColor } from '../data/options.js'

export const COLUMN_W = 10
export const COLUMN_B_W = 5
export const RIB_W = COLUMN_W + COLUMN_B_W
export const FRINGE_COLUMNS = 10
export const B_STITCHES = 22
export const STITCH_HEIGHTS = [6, 5, 6, 6, 5, ...Array<number>(37).fill(5), 6]
export const HEIGHT = STITCH_HEIGHTS.reduce((a, b) => a + b, 0) // 219

export interface Stitch {
  y: number
  h: number
}

export const stitches: Stitch[] = STITCH_HEIGHTS.reduce<Stitch[]>((acc, h) => {
  const prev = acc[acc.length - 1]
  acc.push({ y: prev ? prev.y + prev.h : 0, h })
  return acc
}, [])

const bStitchH = HEIGHT / B_STITCHES
export const bStitches: Stitch[] = Array.from({ length: B_STITCHES }, (_, i) => ({
  y: i * bStitchH,
  h: bStitchH,
}))

export function scarfSize(ribs: number, withFringe: boolean) {
  const fringeWidth = withFringe ? FRINGE_COLUMNS * COLUMN_W : 0
  const bodyWidth = ribs * RIB_W
  return { fringeWidth, bodyWidth, width: fringeWidth * 2 + bodyWidth, height: HEIGHT }
}

const n = (v: number) => Number(v.toFixed(3))

/**
 * La bufanda como SVG autónomo (colores resueltos, sin variables CSS), para rasterizarla
 * en el servidor. Mismo dibujo que ScarfPreview.vue.
 */
export function scarfSvg(base: YarnColor, fringe: YarnColor | null, ribs: number): string {
  const { fringeWidth, bodyWidth, width, height } = scarfSize(ribs, !!fringe)
  const stitch = 'stroke-width="1"'
  const colA = stitches
    .map(
      (s) =>
        `<rect x="0.5" y="${n(s.y + 0.5)}" width="9" height="${n(s.h - 1)}" rx="${n((s.h - 1) / 2)}" fill="${base.fill}" stroke="${base.edge}" ${stitch}/>`,
    )
    .join('')
  const colB = bStitches
    .map(
      (s) =>
        `<rect x="0.5" y="${n(s.y + 0.5)}" width="${COLUMN_B_W - 1}" height="${n(s.h - 1)}" rx="${(COLUMN_B_W - 1) / 2}" fill="${base.fill}" stroke="${base.edge}" ${stitch}/>`,
    )
    .join('')
  const colFringe = fringe
    ? stitches
        .filter((_, i) => i % 2 === 0)
        .map((s) => `<rect x="0" y="${s.y}" width="10" height="${s.h}" rx="${s.h / 2}" fill="${fringe.fill}"/>`)
        .join('')
    : ''

  const fringeUses = (dx: number) =>
    Array.from(
      { length: FRINGE_COLUMNS },
      (_, c) => `<use href="#fr" x="${dx + c * COLUMN_W}"/>`,
    ).join('')

  const body = Array.from(
    { length: ribs },
    (_, r) =>
      `<use href="#ca" x="${fringeWidth + r * RIB_W}"/><use href="#cb" x="${fringeWidth + r * RIB_W + COLUMN_W}"/>`,
  ).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><g id="ca">${colA}</g><g id="cb">${colB}</g><g id="fr">${colFringe}</g></defs>` +
    (fringe ? fringeUses(0) + fringeUses(fringeWidth + bodyWidth) : '') +
    `<rect x="${fringeWidth + 3}" y="4" width="${bodyWidth - 6}" height="${height - 6}" fill="${base.gap}"/>` +
    body +
    `</svg>`
  )
}
