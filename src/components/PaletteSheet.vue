<script setup lang="ts">
// Drawer inferior con las 20 cartas DMC para elegir cualquiera de los 390 colores.
// Se abre desde «+ colores» en la fila de color base o de flecos.
// Se cierra con «Cerrar», tocando fuera, con Esc o arrastrando el asa hacia abajo.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { PALETTES } from '../data/options'
import { COPY } from '../data/copy'
import ColorSwatch from './ColorSwatch.vue'

defineProps<{ title: string; selectedId: string | null }>()
const emit = defineEmits<{ select: [id: string]; close: [] }>()

const sheet = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const body = ref<HTMLElement | null>(null)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(async () => {
  document.addEventListener('keydown', onKey)
  await nextTick()
  // preventScroll: el drawer aún está entrando desde abajo; sin esto el navegador
  // desplazaría toda la página para enseñar el botón.
  closeButton.value?.focus({ preventScroll: true })
  // Deja a la vista la carta del color elegido desplazando SOLO el contenido del drawer
  // (scrollIntoView movería también la página).
  const scroller = body.value
  const carta = scroller?.querySelector<HTMLElement>('[aria-pressed="true"]')?.closest<HTMLElement>('.carta')
  if (scroller && carta) {
    scroller.scrollTop = carta.offsetTop - (scroller.clientHeight - carta.offsetHeight) / 2
  }
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

function choose(id: string) {
  emit('select', id)
  emit('close')
}

// --- Arrastrar para cerrar ---------------------------------------------------------------
const dragY = ref(0)
const dragging = ref(false)
const dismissing = ref(false)
let startY = 0
let startTime = 0

function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  dragging.value = true
  startY = e.clientY
  startTime = performance.now()
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  } catch {
    /* sin captura (p. ej. eventos sintéticos): el arrastre sigue funcionando */
  }
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  dragY.value = Math.max(0, e.clientY - startY)
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  const height = sheet.value?.offsetHeight ?? 1
  const velocity = dragY.value / Math.max(1, performance.now() - startTime)
  if (dragY.value > height * 0.25 || velocity > 0.6) {
    // Termina de bajar desde donde se soltó y luego se cierra
    dismissing.value = true
    window.setTimeout(() => emit('close'), 220)
  } else {
    dragY.value = 0
  }
}

const sheetStyle = computed(() => {
  if (dismissing.value) return { transform: 'translateY(100%)', transition: 'transform 0.22s ease-in' }
  if (dragging.value) return { transform: `translateY(${dragY.value}px)`, transition: 'none' }
  if (dragY.value === 0) return undefined
  return { transform: 'translateY(0)', transition: 'transform 0.2s ease-out' }
})
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section ref="sheet" class="sheet" :style="sheetStyle" role="dialog" aria-modal="true" :aria-label="title">
      <header
        class="sheet-header"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <span class="handle" aria-hidden="true" />
        <div class="sheet-bar">
          <h2 class="sheet-title">{{ title }}</h2>
          <button ref="closeButton" type="button" class="close" @click="emit('close')">
            {{ COPY.sheet.close }}
          </button>
        </div>
      </header>

      <div ref="body" class="sheet-body">
        <div v-for="p in PALETTES" :key="p.id" class="carta">
          <p class="carta-label">{{ COPY.sheet.carta }} {{ p.id }}</p>
          <div class="carta-colors">
            <ColorSwatch
              v-for="c in p.colors"
              :key="c.id"
              :color="c.fill"
              :name="c.name"
              :selected="selectedId === c.id"
              @select="choose(c.id)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.18);
}

.sheet {
  position: relative;
  width: 100%;
  max-height: 82%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border-radius: calc(24 * var(--u)) calc(24 * var(--u)) 0 0;
  box-shadow: 0 calc(-8 * var(--u)) calc(32 * var(--u)) rgba(0, 0, 0, 0.12);
  will-change: transform;
}

/* Zona de arrastre: asa + título */
.sheet-header {
  flex: none;
  padding: calc(8 * var(--u)) calc(12 * var(--u)) calc(8 * var(--u));
  touch-action: none;
  cursor: grab;
  user-select: none;
}

.sheet-header:active {
  cursor: grabbing;
}

.handle {
  display: block;
  width: calc(40 * var(--u));
  height: calc(5 * var(--u));
  margin: 0 auto calc(8 * var(--u));
  border-radius: calc(3 * var(--u));
  background: var(--color-brand);
  opacity: 0.25;
}

.sheet-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-l);
  line-height: normal;
  color: var(--color-brand);
}

.sheet-title {
  margin: 0;
  font-size: inherit;
  font-weight: 400;
}

.close {
  text-decoration: underline;
  text-decoration-thickness: from-font;
  text-underline-position: from-font;
}

.sheet-body {
  position: relative; /* referencia de offsetTop para centrar la carta elegida */
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 calc(12 * var(--u)) max(calc(24 * var(--u)), env(safe-area-inset-bottom));
}

.carta + .carta {
  margin-top: calc(16 * var(--u));
}

.carta-label {
  margin: 0 0 calc(10 * var(--u));
  font-size: var(--text-l);
  line-height: 0.9997;
  text-transform: uppercase;
  text-box: trim-both cap alphabetic;
  color: var(--color-brand);
}

.carta-colors {
  display: flex;
  flex-wrap: wrap;
  gap: var(--swatch-gap);
}
</style>
