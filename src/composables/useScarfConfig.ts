import { computed, reactive, watch } from 'vue'
import {
  ALL_COLORS,
  DEFAULT_CONFIG,
  FRINGE_PRICE_EUR,
  LENGTHS,
  findColor,
} from '../data/options'
import { proposeColors, proposeOtherColors } from '../data/proposal'
import { parseOrder } from '../scarf/order'

const STORAGE_KEY = 'safi:scarf-length'

type Config = typeof DEFAULT_CONFIG

/** Solo se recuerda el largo: los colores son una propuesta nueva en cada visita. */
function loadLength(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return LENGTHS.some((l) => l.id === saved) ? saved! : DEFAULT_CONFIG.lengthId
  } catch {
    return DEFAULT_CONFIG.lengthId
  }
}

/**
 * Estado inicial: si se llega desde el enlace de un pedido (/?l=90&b=7285&f=7928), esa
 * bufanda; si no, el largo recordado y una propuesta de color nueva.
 */
function initialConfig(): Config {
  const shared = parseOrder(new URLSearchParams(location.search))
  if (shared) return shared
  return { lengthId: loadLength(), ...proposeColors() }
}

// Estado compartido a nivel de módulo: una sola bufanda por sesión.
const state = reactive<Config>(initialConfig())

watch(
  () => state.lengthId,
  (lengthId) => {
    try {
      localStorage.setItem(STORAGE_KEY, lengthId)
    } catch {
      /* sin almacenamiento disponible: no pasa nada */
    }
  },
)

export function useScarfConfig() {
  const length = computed(() => LENGTHS.find((l) => l.id === state.lengthId) ?? LENGTHS[0]!)
  const baseColor = computed(() => findColor(state.baseColorId) ?? ALL_COLORS[0]!)
  const fringeColor = computed(() => findColor(state.fringeColorId))
  /** Precio total: largo + suplemento si lleva flecos */
  const price = computed(() => length.value.price + (fringeColor.value ? FRINGE_PRICE_EUR : 0))

  /** «Otra combinación»: nueva propuesta de color; mantiene el largo y «Sin flecos» */
  function shuffleColors() {
    Object.assign(state, proposeOtherColors(state))
  }

  return { state, length, baseColor, fringeColor, price, shuffleColors }
}
