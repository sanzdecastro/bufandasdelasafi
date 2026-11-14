import { computed, reactive, watch } from 'vue'
import {
  ALL_COLORS,
  RIBS_PER_90CM,
  DEFAULT_CONFIG,
  FRINGE_PRICE_EUR,
  LENGTHS,
  findColor,
} from '../data/options'
import { proposeColors } from '../data/proposal'

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

// Estado compartido a nivel de módulo: una sola bufanda por sesión.
const state = reactive<Config>({ lengthId: loadLength(), ...proposeColors() })

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
  const bodyRibs = computed(() => Math.round((RIBS_PER_90CM * length.value.cm) / 90))
  /** Precio total: largo + suplemento si lleva flecos */
  const price = computed(() => length.value.price + (fringeColor.value ? FRINGE_PRICE_EUR : 0))

  return { state, length, baseColor, fringeColor, bodyRibs, price }
}
