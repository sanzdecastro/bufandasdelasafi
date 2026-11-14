// Propuesta de color aleatoria para cada visita.
//
// Reglas:
// - La base sale de toda la paleta DMC, evitando extremos casi negros o casi blancos.
// - Los flecos van «engamados» con la base (misma familia de tono, con algo de contraste de
//   luz para que se distingan) o, a veces, en el tono complementario para que contrasten.
// - Bases neutras (grises, crudos, marrones apagados): flecos neutros de otra luz o un color vivo.

import { ALL_COLORS, type YarnColor } from './options'

interface Hsl {
  h: number // 0–360
  s: number // 0–1
  l: number // 0–1
}

function toHsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
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

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

const NEUTRAL_SATURATION = 0.18
/** Probabilidad de proponer flecos complementarios en lugar de engamados */
const COMPLEMENTARY_CHANCE = 0.4

const COLORS = ALL_COLORS.map((color) => ({ color, hsl: toHsl(color.fill) }))
type Entry = (typeof COLORS)[number]

const isNeutral = (e: Entry) => e.hsl.s < NEUTRAL_SATURATION

/** Gama: mismo tono (±30°) y suficiente diferencia de luz para que los flecos se lean */
function inGamut(base: Entry, c: Entry): boolean {
  const dl = Math.abs(base.hsl.l - c.hsl.l)
  if (isNeutral(base)) return isNeutral(c) && dl >= 0.18
  return !isNeutral(c) && hueDistance(base.hsl.h, c.hsl.h) <= 30 && dl >= 0.12 && dl <= 0.45
}

/** Complementario: tono opuesto (±30°), color vivo y luz no demasiado distinta */
function isComplementary(base: Entry, c: Entry): boolean {
  if (isNeutral(c) || c.hsl.s < 0.35) return false
  if (isNeutral(base)) return c.hsl.l > 0.25 && c.hsl.l < 0.7
  return hueDistance(base.hsl.h, c.hsl.h) >= 150 && Math.abs(base.hsl.l - c.hsl.l) <= 0.35
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!
}

/** Flecos: sin casi negros ni casi blancos, que se leen como «negro» o «blanco» y no como gama */
const fringeCandidates = (base: Entry) =>
  COLORS.filter((c) => c !== base && c.hsl.l > 0.12 && c.hsl.l < 0.92)

/** Elige n colores repartidos de claro a oscuro (resultado estable para la misma lista) */
function spreadByLightness(list: Entry[], n: number): YarnColor[] {
  const sorted = [...list].sort((a, b) => b.hsl.l - a.hsl.l)
  if (sorted.length <= n) return sorted.map((e) => e.color)
  const picks = new Set<number>()
  for (let i = 0; i < n; i++) picks.add(Math.round((i * (sorted.length - 1)) / (n - 1)))
  return [...picks].map((i) => sorted[i]!.color)
}

const entryOf = (id: string) => COLORS.find((e) => e.color.id === id) ?? COLORS[0]!

export interface ColorProposal {
  baseColorId: string
  fringeColorId: string
}

export function proposeColors(): ColorProposal {
  const bases = COLORS.filter((e) => e.hsl.l > 0.18 && e.hsl.l < 0.88)
  const base = pick(bases)

  const fringes = fringeCandidates(base)
  const gamut = fringes.filter((c) => inGamut(base, c))
  const complementary = fringes.filter((c) => isComplementary(base, c))

  const preferComplementary = Math.random() < COMPLEMENTARY_CHANCE
  const first = preferComplementary ? complementary : gamut
  const second = preferComplementary ? gamut : complementary
  const fringe = first.length ? pick(first) : second.length ? pick(second) : base

  return { baseColorId: base.color.id, fringeColorId: fringe.color.id }
}

/**
 * Sugerencias para la base: la misma familia de color (tono ±30°, o neutros si la base es
 * neutra), repartidas de claro a oscuro. Cambian cuando cambia la base.
 */
export function suggestBaseColors(baseId: string, n = 6): YarnColor[] {
  const base = entryOf(baseId)
  const family = (maxHue: number) =>
    COLORS.filter((c) => {
      // Sin casi negros ni casi blancos (siguen disponibles en el panel de cartas)
      if (c === base || c.hsl.l <= 0.12 || c.hsl.l >= 0.92) return false
      if (isNeutral(base)) return isNeutral(c)
      return !isNeutral(c) && hueDistance(base.hsl.h, c.hsl.h) <= maxHue
    })
  let list = family(30)
  if (list.length < n) list = family(45)
  return spreadByLightness(list, n)
}

/** Sugerencias de flecos para una base: 3 en su gama y 3 complementarios que contrasten */
export function suggestFringeColors(baseId: string): {
  gamut: YarnColor[]
  complementary: YarnColor[]
} {
  const base = entryOf(baseId)
  const fringes = fringeCandidates(base)
  return {
    gamut: spreadByLightness(
      fringes.filter((c) => inGamut(base, c)),
      3,
    ),
    complementary: spreadByLightness(
      fringes.filter((c) => isComplementary(base, c)),
      3,
    ),
  }
}
