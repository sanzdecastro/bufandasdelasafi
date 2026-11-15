// Bufanda realista: foto de Figma (15:8249) separada en dos capas alineadas en escala de grises
// con transparencia (public/scarf/cuerpo.png y flecos.png, 1024 × 768). Cada capa se tiñe con
// un filtro SVG que usa la luz de la lana como sombra del color elegido.
//
// Se usa tal cual en la web (ScarfPreview.vue, colores con variables CSS) y en el servidor
// (api/og.ts, colores resueltos e imágenes en base64), así WhatsApp ve la misma bufanda.

export const PHOTO_W = 1024
export const PHOTO_H = 768

/**
 * Niveles: la lana de la foto va de ~160 (sombras) a ~245 (luces) sobre 255. Se estira para
 * que las luces lleguen a blanco (y tomen el color DMC exacto) y las sombras ganen profundidad.
 *   luz' = luz · SLOPE + INTERCEPT   (0.35 → 0, 0.953 → 1)
 */
const SLOPE = 1.66
const INTERCEPT = -0.58

/**
 * Teñido (feComposite arithmetic):  color · luz + TEXTURE · (luz − MID)
 * La primera parte es una multiplicación (lo blanco toma el color, las sombras lo oscurecen).
 * La segunda conserva el relieve del punto en colores muy oscuros, donde la multiplicación
 * sola lo aplana.
 */
const TEXTURE = 0.3
const MID = 0.85

/**
 * Los colores claros (crudos, pasteles) no aguantan la sombra completa: el gris de la
 * multiplicación los ensucia. Cuanto más claro es el color, más suave la sombra y menos
 * relieve extra. LIGHT_SHADOW es la profundidad que queda en el color más claro (1 = completa).
 */
const LIGHT_SHADOW = 0.6

export interface DyeParams {
  slope: number
  intercept: number
  k3: number
  k4: number
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Parámetros del filtro para un color (hex). Los oscuros mantienen la sombra completa. */
export function dyeParams(hex: string): DyeParams {
  const n = parseInt(hex.replace('#', ''), 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  const light = Number.isFinite(lum) ? smoothstep(0.45, 0.92, lum) : 0
  const depth = 1 - (1 - LIGHT_SHADOW) * light
  const texture = TEXTURE * (1 - light)
  const r = (v: number) => Number(v.toFixed(4))
  return {
    // luz'' = 1 − depth · (1 − luz'):  sombras menos hondas, luces igual de blancas
    slope: r(depth * SLOPE),
    intercept: r(1 - depth + depth * INTERCEPT),
    k3: r(texture),
    k4: r(-texture * MID),
  }
}

function dyeFilter(id: string, color: string, p: DyeParams): string {
  const func = (c: string) => `<feFunc${c} type="linear" slope="${p.slope}" intercept="${p.intercept}"/>`
  return (
    `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    // Luz de la capa (ya es gris) con los niveles estirados
    `<feComponentTransfer in="SourceGraphic" result="luz">${func('R')}${func('G')}${func('B')}</feComponentTransfer>` +
    `<feFlood style="flood-color: ${color}" result="tinte"/>` +
    `<feComposite in="tinte" in2="luz" operator="arithmetic" k1="1" k2="0" k3="${p.k3}" k4="${p.k4}" result="tenido"/>` +
    // Solo donde hay lana
    `<feComposite in="tenido" in2="SourceAlpha" operator="in"/>` +
    `</filter>`
  )
}

/**
 * Actualiza la sombra de un filtro ya pintado (la web cambia el color por variable CSS y aquí
 * ajusta la profundidad al nuevo color sin rehacer el SVG).
 */
export function applyDyeParams(root: ParentNode, filterId: string, p: DyeParams): void {
  const filter = root.querySelector(`#${filterId}`)
  if (!filter) return
  filter.querySelectorAll('feFuncR, feFuncG, feFuncB').forEach((f) => {
    f.setAttribute('slope', String(p.slope))
    f.setAttribute('intercept', String(p.intercept))
  })
  const dye = filter.querySelector('feComposite[operator="arithmetic"]')
  dye?.setAttribute('k3', String(p.k3))
  dye?.setAttribute('k4', String(p.k4))
}

/**
 * Sombra bajo la bufanda: sigue la silueta de las dos capas (no el marco de la foto) y se tiñe
 * con el color de marca para no ensuciar el fondo pastel. Medidas en unidades del viewBox
 * (la foto se ve a ~0,6 de su tamaño: 16 unidades ≈ 10 px).
 */
const SHADOW = { dy: 16, blur: 16, opacity: 0.32 }

function shadowFilter(id: string, color: string): string {
  return (
    `<filter id="${id}" x="-5%" y="-5%" width="110%" height="115%" color-interpolation-filters="sRGB">` +
    `<feDropShadow dx="0" dy="${SHADOW.dy}" stdDeviation="${SHADOW.blur}" style="flood-color: ${color}; flood-opacity: ${SHADOW.opacity}"/>` +
    `</filter>`
  )
}

export interface ScarfPhotoOptions {
  /** Color de la base: hex o var(--…) */
  base: string
  /** Color de los flecos (hex o var(--…)), o null si no lleva */
  fringe: string | null
  /** Hex de cada color para ajustar la sombra (si base/fringe son variables CSS) */
  baseTone?: string
  fringeTone?: string
  bodyHref: string
  fringeHref: string
  /** Color de la sombra (hex o var(--…)); sin él, la bufanda va sin sombra */
  shadow?: string
  /** Prefijo para los ids de los filtros (evita choques si hay varias en la página) */
  id?: string
}

/** La bufanda como SVG (viewBox 1024 × 768). Los flecos van en <g class="scarf-fringe">. */
export function scarfPhotoSvg(o: ScarfPhotoOptions): string {
  const id = o.id ?? 'scarf'
  const tone = (color: string, hex?: string) => dyeParams(hex ?? color)
  const fringeLayer =
    o.fringe === null
      ? ''
      : `<g class="scarf-fringe"><image href="${o.fringeHref}" width="${PHOTO_W}" height="${PHOTO_H}" filter="url(#${id}-flecos)"/></g>`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PHOTO_W} ${PHOTO_H}" width="${PHOTO_W}" height="${PHOTO_H}">` +
    `<defs>${dyeFilter(`${id}-cuerpo`, o.base, tone(o.base, o.baseTone))}${o.fringe === null ? '' : dyeFilter(`${id}-flecos`, o.fringe, tone(o.fringe, o.fringeTone))}${o.shadow ? shadowFilter(`${id}-sombra`, o.shadow) : ''}</defs>` +
    // Cuerpo y flecos en un grupo: la sombra sigue a los dos (y se va con los flecos al quitarlos)
    `<g${o.shadow ? ` filter="url(#${id}-sombra)"` : ''}>` +
    `<image href="${o.bodyHref}" width="${PHOTO_W}" height="${PHOTO_H}" filter="url(#${id}-cuerpo)"/>` +
    fringeLayer +
    `</g>` +
    `</svg>`
  )
}
