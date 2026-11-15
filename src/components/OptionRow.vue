<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { hapticTick } from '../composables/useHaptics'
import { useDragScroll } from '../composables/useDragScroll'

defineProps<{ label: string; gap?: 'text' | 'swatch' }>()

const lane = ref<HTMLElement | null>(null)
// Escritorio: arrastrar con el ratón y rueda vertical → horizontal, con snap al soltar
useDragScroll(lane, { snap: true })
const labelEl = ref<HTMLElement | null>(null)
/** true cuando, al deslizar, las opciones llegan a la etiqueta: la etiqueta pasa por delante */
const covered = ref(false)

/** Índice de la opción que está en la línea de snap (inicio de las opciones, 145 px) */
function snappedIndex(el: HTMLElement): number {
  const line = el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft)
  const items = Array.from(el.children) as HTMLElement[]
  const i = items.findIndex((item) => item.getBoundingClientRect().right > line + 1)
  return i === -1 ? items.length - 1 : i
}

let frame = 0
let lastIndex = 0
function check() {
  frame = 0
  const el = lane.value
  const first = el?.firstElementChild
  const text = labelEl.value
  if (!el || !first || !text) return
  const labelRight = text.getBoundingClientRect().right
  covered.value = first.getBoundingClientRect().left < labelRight + 6

  // «Tic» háptico cada vez que una opción nueva pasa por la línea de snap
  const index = snappedIndex(el)
  if (index !== lastIndex) {
    lastIndex = index
    hapticTick()
  }
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(check)
}

onMounted(() => {
  lane.value?.addEventListener('scroll', onScroll, { passive: true })
  if (lane.value) lastIndex = snappedIndex(lane.value)
  check()
})

onBeforeUnmount(() => {
  lane.value?.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="row" role="group" :aria-label="label">
    <span ref="labelEl" class="label" :class="{ covered }" data-enter="fade" aria-hidden="true">{{ label }}</span>
    <div ref="lane" class="options" :class="gap === 'text' ? 'gap-text' : 'gap-swatch'">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/*
 * Como en Figma: la etiqueta va en posición absoluta y el carril de opciones ocupa toda la
 * fila empezando a 145 px. Al deslizar, las opciones pasan por debajo de la etiqueta.
 */
.row {
  position: relative;
  height: var(--row-height);
  font-size: var(--text-l);
  line-height: normal;
}

/*
 * Etiqueta (Figma 3:8146): Offset TM 32 px tal como está escrita, color de marca.
 * Recortada a la altura de las mayúsculas (0.7158em) y centrada en la fila.
 */
.label {
  position: absolute;
  left: calc(11 * var(--u));
  top: calc((var(--row-height) - 0.7158em) / 2);
  z-index: 0;
  font-size: var(--text-xl);
  line-height: 0.9997;
  text-box: trim-both cap alphabetic;
  color: var(--color-brand);
  white-space: nowrap;
  pointer-events: none;
}

/*
 * Cuando las opciones pasan por debajo, la etiqueta queda por delante sobre una pastilla
 * del color de fondo, que aparece con una transición corta.
 */
.label::before {
  content: '';
  position: absolute;
  inset: calc(-8 * var(--u)) calc(-8 * var(--u));
  z-index: -1;
  border-radius: calc(48 * var(--u));
  background: var(--color-bg);
  box-shadow: 0 calc(2 * var(--u)) calc(10 * var(--u)) rgba(0, 0, 0, 0.12);
  opacity: 0;
  transform: scale(0.85);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.label.covered {
  z-index: 2;
}

.label.covered::before {
  opacity: 1;
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .label::before {
    transition: none;
  }
}

/* Sin text-box (Firefox): mismo recorte superior con el margen medido para Offset TM */
@supports not (text-box: trim-both cap alphabetic) {
  .label {
    margin-top: -0.1434em;
  }
}

/* Las opciones se salen por la derecha: carril con scroll horizontal */
.options {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: var(--label-column);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  /* Snap: al soltar, una opción queda alineada al inicio del carril (145 px) */
  scroll-snap-type: x mandatory;
  scroll-padding-left: var(--label-column);
}

/* Escritorio: se puede arrastrar con el ratón */
@media (hover: hover) and (pointer: fine) {
  .options {
    cursor: grab;
  }

  .options.is-dragging,
  .options.is-dragging :slotted(*) {
    cursor: grabbing;
    user-select: none;
  }
}

/* Cada opción es un punto de snap; se pueden saltar varias en un mismo gesto */
.options > :slotted(*) {
  scroll-snap-align: start;
}

.options::-webkit-scrollbar {
  display: none;
}

.gap-text {
  gap: var(--option-gap);
}

.gap-swatch {
  gap: var(--swatch-gap);
}
</style>
