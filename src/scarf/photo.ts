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

/**
 * Bufanda entera a partir de un solo extremo (solo hay foto de uno):
 *   extremo izquierdo (la foto hasta TILE_X) → tramo del cuerpo repetido → el mismo extremo
 *   girado 180°.
 * El tramo TILE_X…TILE_X + TILE_W (unas 10 columnas de punto) encaja consigo mismo; la junta
 * con el extremo girado se funde en SEAM unidades. El cuerpo de la foto ocupa y ≈ 150–632 y
 * su centro está DY por encima del de la imagen: el extremo girado se baja DY para alinearlo.
 */
const TILE_X = 578
const TILE_W = 298
const SEAM = 40
const DY = 16
const OVERLAP = 2
/** Arranque del cuerpo en la foto (tras los nudos de los flecos) */
const BODY_START = 300
/** Unidades por cm: el cuerpo mide ~480 de alto y se supone una bufanda de 18 cm de ancho */
const UNITS_PER_CM = 480 / 18

export interface ScarfLayout {
  /** Ancho total del SVG (el alto es PHOTO_H) */
  width: number
  /** Tramos repetidos: posición x y ancho (el último puede ir recortado) */
  tiles: { x: number; w: number }[]
  /** x donde empieza la foto girada */
  endX: number
}

/** Medidas de la bufanda entera para un largo (cm de cuerpo, sin flecos) */
export function scarfLayout(lengthCm: number): ScarfLayout {
  const ends = 2 * (TILE_X - BODY_START)
  const middle = Math.max(TILE_W, Math.round(lengthCm * UNITS_PER_CM - ends))
  const tiles: { x: number; w: number }[] = []
  // Los tramos pasan SEAM por debajo del extremo girado, que se funde sobre ellos
  for (let x = 0; x < middle + SEAM; x += TILE_W) {
    tiles.push({ x: TILE_X + x, w: Math.min(TILE_W, middle + SEAM - x) })
  }
  return { width: TILE_X * 2 + middle, tiles, endX: TILE_X + middle - (PHOTO_W - TILE_X) }
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
  /** Largo del cuerpo en cm (sin flecos): decide cuántas veces se repite el tramo central */
  lengthCm: number
  /** Color de la sombra (hex o var(--…)); sin él, la bufanda va sin sombra */
  shadow?: string
  /** Prefijo para los ids de los filtros (evita choques si hay varias en la página) */
  id?: string
}

/**
 * La bufanda entera como SVG (alto 768, ancho según el largo: ver scarfLayout). Los flecos van
 * en <g class="scarf-fringe">, uno por extremo; el del extremo girado queda dentro de su giro.
 */
export function scarfPhotoSvg(o: ScarfPhotoOptions): string {
  const id = o.id ?? 'scarf'
  const tone = (color: string, hex?: string) => dyeParams(hex ?? color)
  const { width, tiles, endX } = scarfLayout(o.lengthCm)
  const img = (href: string, extra = '') =>
    `<image href="${href}" width="${PHOTO_W}" height="${PHOTO_H}"${extra}/>`
  // Recorte de la foto: muestra las columnas from…from + w en la posición x. Cada recorte se
  // alarga OVERLAP por la derecha para que el antialias no deje una línea entre tramos
  const crop = (href: string, x: number, from: number, w: number) =>
    `<svg x="${x}" y="0" width="${w + OVERLAP}" height="${PHOTO_H}" viewBox="${from} 0 ${w + OVERLAP} ${PHOTO_H}">${img(href)}</svg>`
  // Extremo girado 180° (alrededor de su propio centro y bajado DY)
  const rotated = `translate(${endX + PHOTO_W} ${DY + PHOTO_H}) rotate(180)`
  const fringe = (inner: string) =>
    o.fringe === null ? '' : `<g class="scarf-fringe" filter="url(#${id}-flecos)">${inner}</g>`

  const defs =
    dyeFilter(`${id}-cuerpo`, o.base, tone(o.base, o.baseTone)) +
    (o.fringe === null ? '' : dyeFilter(`${id}-flecos`, o.fringe, tone(o.fringe, o.fringeTone))) +
    (o.shadow ? shadowFilter(`${id}-sombra`, o.shadow) : '') +
    // Junta con el extremo girado: su cuerpo se funde con el último tramo
    `<linearGradient id="${id}-junta" gradientUnits="userSpaceOnUse" x1="${TILE_X - SEAM}" y1="0" x2="${TILE_X}" y2="0">` +
    `<stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<mask id="${id}-fin" maskUnits="userSpaceOnUse" x="0" y="0" width="${PHOTO_W}" height="${PHOTO_H}">` +
    `<rect width="${PHOTO_W}" height="${PHOTO_H}" fill="url(#${id}-junta)"/></mask>`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${PHOTO_H}" width="${width}" height="${PHOTO_H}">` +
    `<defs>${defs}</defs>` +
    // Todo en un grupo: la sombra sigue a cuerpo y flecos (y se va con los flecos al quitarlos)
    `<g${o.shadow ? ` filter="url(#${id}-sombra)"` : ''}>` +
    `<g filter="url(#${id}-cuerpo)">` +
    crop(o.bodyHref, 0, 0, TILE_X) +
    tiles.map((t) => crop(o.bodyHref, t.x, TILE_X, t.w)).join('') +
    `<g transform="${rotated}">${img(o.bodyHref, ` mask="url(#${id}-fin)"`)}</g>` +
    `</g>` +
    fringe(img(o.fringeHref)) +
    `<g transform="${rotated}">${fringe(img(o.fringeHref))}</g>` +
    `</g>` +
    `</svg>`
  )
}
