// Tema de color de toda la web (intro incluida) a partir de la propuesta de colores de la visita.
//
// - Fondo: versión pastel del color base.
// - Marca (textos, firma, botón): versión oscura del color base, con contraste AA sobre el fondo.
// - Resaltado de la opción elegida: versión pastel, algo más intensa, del color de los flecos.

interface Hsl {
  h: number
  s: number
  l: number
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHsl([r, g, b]: [number, number, number]): Hsl {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s, l }
}

function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.round((v + m) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

function relativeLuminance(hex: string): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Pastel: mismo tono, saturación contenida y mucha luz */
function pastel(hex: string, lightness: number, maxSaturation: number): string {
  const { h, s } = rgbToHsl(hexToRgb(hex))
  return hslToHex({ h, s: Math.min(s, maxSaturation), l: lightness })
}

/** Versión oscura del tono que cumpla contraste AA (4.5:1) sobre todos los fondos dados */
function deep(hex: string, backgrounds: string[]): string {
  const { h, s } = rgbToHsl(hexToRgb(hex))
  const sat = s < 0.12 ? s : Math.min(Math.max(s, 0.5), 0.85)
  let l = 0.34
  let color = hslToHex({ h, s: sat, l })
  const minContrast = (c: string) => Math.min(...backgrounds.map((bg) => contrastRatio(c, bg)))
  while (minContrast(color) < 4.5 && l > 0.05) {
    l -= 0.02
    color = hslToHex({ h, s: sat, l })
  }
  return color
}

export interface Theme {
  bg: string
  brand: string
  highlight: string
}

export function computeTheme(baseHex: string, fringeHex: string | null): Theme {
  const bg = pastel(baseHex, 0.95, 0.55)
  const highlight = pastel(fringeHex ?? baseHex, 0.84, 0.65)
  // El texto va sobre el fondo y, en la opción elegida, sobre el resaltado
  const brand = deep(baseHex, [bg, highlight])
  return { bg, brand, highlight }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement.style
  root.setProperty('--color-bg', theme.bg)
  root.setProperty('--color-brand', theme.brand)
  root.setProperty('--color-highlight', theme.highlight)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg)
}
