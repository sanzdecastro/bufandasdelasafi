import { DMC_PALETTES } from './dmc-palettes.js'

export interface YarnColor {
  /** Código DMC (p. ej. «7106», «BLANC») */
  id: string
  name: string
  /** Relleno del punto */
  fill: string
  /** Borde del punto (en Figma, un tono más oscuro del mismo color) */
  edge: string
  /** Fondo que asoma entre puntos del cuerpo */
  gap: string
}

export interface Palette {
  id: string
  label: string
  /** Color resumen: círculo en porciones con los colores de la carta */
  gradient: string
  colors: YarnColor[]
}

export interface LengthOption {
  id: string
  label: string
  cm: number
  /** Precio en euros */
  price: number
}

/** Suplemento por añadir flecos, en euros (igual para todos los largos) */
export const FRINGE_PRICE_EUR = 5

export const LENGTHS: LengthOption[] = [
  { id: '120', label: '120 cm', cm: 120, price: 60 },
  { id: '90', label: '90 cm', cm: 90, price: 50 },
]

/** Oscurece un hex multiplicando cada canal (0–1). */
function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16)
  const channel = (shift: number) =>
    Math.round(((n >> shift) & 255) * factor)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(16)}${channel(8)}${channel(0)}`
}

/** Tonos de borde y fondo tal como están dibujados en Figma; el resto se calculan. */
const FIGMA_OVERRIDES: Record<string, Partial<YarnColor>> = {
  '7106': { edge: '#c11119' },
  '7292': { edge: '#86859b', gap: '#726f6f' },
}

const EDGE_FACTOR = 0.9
const GAP_FACTOR = 0.72

/** Luminancia relativa aproximada (0 = negro, 1 = blanco) para ordenar el degradado */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

const PIZZA_SLICES = 6

/**
 * «Pizza» de color: 6 porciones con los 6 colores más claros de la carta
 * (del más claro al menos claro, en sentido horario).
 */
function paletteGradient(hexes: string[]): string {
  const picks = [...hexes].sort((a, b) => luminance(b) - luminance(a)).slice(0, PIZZA_SLICES)
  const slice = 360 / PIZZA_SLICES
  const stops = picks.map(
    (hex, i) => `${hex} ${(i * slice).toFixed(2)}deg ${((i + 1) * slice).toFixed(2)}deg`,
  )
  return `conic-gradient(${stops.join(', ')})`
}

export const PALETTES: Palette[] = DMC_PALETTES.map((p) => ({
  id: p.id,
  label: `Carta ${p.id}`,
  gradient: paletteGradient(p.colors.map((c) => c.hex)),
  colors: p.colors.map(({ code, hex }) => ({
    id: code,
    name: `DMC ${code}`,
    fill: hex,
    edge: shade(hex, EDGE_FACTOR),
    gap: shade(hex, GAP_FACTOR),
    ...FIGMA_OVERRIDES[code],
  })),
}))

export const ALL_COLORS: YarnColor[] = PALETTES.flatMap((p) => p.colors)

export function findColor(id: string | null): YarnColor | null {
  return id === null ? null : (ALL_COLORS.find((c) => c.id === id) ?? null)
}

export const DEFAULT_CONFIG = {
  lengthId: '90',
  /** Gris azulado de la bufanda en Figma (Carta-20/7292). Al entrar se usa una propuesta aleatoria */
  baseColorId: '7292',
  /** Rojo de los flecos en Figma (Carta-01/7106). null = sin flecos */
  fringeColorId: '7106' as string | null,
}
