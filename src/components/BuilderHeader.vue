<script setup lang="ts">
// Cabecera (Figma 3:8160): firma vertical + tres líneas a 32 px recortadas a la altura
// de las mayúsculas (23 px cada una, 8 px entre líneas), centradas con la firma.
import { ref, watch } from 'vue'
import firmaRaw from '../assets/figma/safi-firma-vertical.svg?raw'
import { drawSignatureSvgs } from '../composables/useSignatureDraw'

const props = defineProps<{ play: boolean }>()

// SVG en línea, en el color de marca del tema
const firmaSvg = firmaRaw.replace(/#045DB9/gi, 'currentColor')
const mark = ref<HTMLElement | null>(null)

// Entrada de la home: la firma se escribe igual que en la intro, más rápido
const DRAW_MS = 450
watch(
  () => props.play,
  (play) => {
    const svg = mark.value?.querySelector('svg')
    if (!play || !svg || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    drawSignatureSvgs([svg], DRAW_MS)
  },
)
</script>

<template>
  <header class="header">
    <span class="firma">
      <span ref="mark" class="mark" role="img" aria-label="Safi" v-html="firmaSvg" />
    </span>
    <h1 class="title">
      <span class="line" data-enter="clip">Bufandas</span>
      <span class="line" data-enter="clip">handmade ©1991</span>
      <span class="line" data-enter="clip">desde mi sofa</span>
    </h1>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: calc(16 * var(--u));
  padding: 0 calc(12 * var(--u));
}

/* Figma 3:8171: 48.41 × 97; el SVG trae ~1 px de sangrado alrededor */
.firma {
  position: relative;
  flex: none;
  width: calc(48.41 * var(--u));
  height: calc(97 * var(--u));
}

.firma .mark {
  position: absolute;
  left: calc(-1.065 * var(--u));
  top: calc(-1 * var(--u));
  width: calc(50.4891 * var(--u));
  height: calc(99.1928 * var(--u));
  display: block;
  max-width: none;
  color: var(--color-brand);
}

.mark :deep(svg) {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.title {
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--u));
  font-size: var(--text-xl);
  font-weight: 400;
  line-height: 0.9997;
  text-transform: uppercase;
  color: var(--color-brand);
  white-space: nowrap;
}

/* Cada línea se recorta a la altura de las mayúsculas (Figma: text-box-trim cap/alphabetic) */
.line {
  display: block;
  text-box: trim-both cap alphabetic;
}

/* Navegadores sin text-box (Firefox): mismo recorte con márgenes medidos para Offset TM */
@supports not (text-box: trim-both cap alphabetic) {
  .line {
    margin-top: -0.1434em;
    margin-bottom: -0.1405em;
  }
}
</style>
