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

function dyeFilter(id: string, color: string): string {
  return (
    `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    // Luz de la capa (ya es gris) con los niveles estirados
    `<feComponentTransfer in="SourceGraphic" result="luz">` +
    `<feFuncR type="linear" slope="${SLOPE}" intercept="${INTERCEPT}"/>` +
    `<feFuncG type="linear" slope="${SLOPE}" intercept="${INTERCEPT}"/>` +
    `<feFuncB type="linear" slope="${SLOPE}" intercept="${INTERCEPT}"/>` +
    `</feComponentTransfer>` +
    `<feFlood style="flood-color: ${color}" result="tinte"/>` +
    `<feComposite in="tinte" in2="luz" operator="arithmetic" k1="1" k2="0" k3="${TEXTURE}" k4="${-TEXTURE * MID}" result="tenido"/>` +
    // Solo donde hay lana
    `<feComposite in="tenido" in2="SourceAlpha" operator="in"/>` +
    `</filter>`
  )
}

export interface ScarfPhotoOptions {
  /** Color de la base: hex o var(--…) */
  base: string
  /** Color de los flecos (hex o var(--…)), o null si no lleva */
  fringe: string | null
  bodyHref: string
  fringeHref: string
  /** Prefijo para los ids de los filtros (evita choques si hay varias en la página) */
  id?: string
}

/** La bufanda como SVG (viewBox 1024 × 768). Los flecos van en <g class="scarf-fringe">. */
export function scarfPhotoSvg(o: ScarfPhotoOptions): string {
  const id = o.id ?? 'scarf'
  const fringeLayer =
    o.fringe === null
      ? ''
      : `<g class="scarf-fringe"><image href="${o.fringeHref}" width="${PHOTO_W}" height="${PHOTO_H}" filter="url(#${id}-flecos)"/></g>`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PHOTO_W} ${PHOTO_H}" width="${PHOTO_W}" height="${PHOTO_H}">` +
    `<defs>${dyeFilter(`${id}-cuerpo`, o.base)}${o.fringe === null ? '' : dyeFilter(`${id}-flecos`, o.fringe)}</defs>` +
    `<image href="${o.bodyHref}" width="${PHOTO_W}" height="${PHOTO_H}" filter="url(#${id}-cuerpo)"/>` +
    fringeLayer +
    `</svg>`
  )
}
