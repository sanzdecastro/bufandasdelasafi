<script setup lang="ts">
// Círculo al final de las filas de color: abre el panel con las 20 cartas DMC. La pizza
// resume la variedad de la carta. Sin texto visible; el nombre lo lee el lector de pantalla.
import { PALETTES } from '../data/options'
import { COPY } from '../data/copy'

defineEmits<{ open: [] }>()

// Una porción por familia (rojos, rosas, lilas, azules, verdes, amarillos), del tono medio de cada carta
const SLICE_CARTAS = ['01', '03', '04', '07', '09', '13']
const slices = SLICE_CARTAS.map((id) => {
  const colors = PALETTES.find((p) => p.id === id)!.colors
  return colors[Math.floor(colors.length / 3)]!.fill
})
const step = 360 / slices.length
const pizza = `conic-gradient(${slices.map((c, i) => `${c} ${i * step}deg ${(i + 1) * step}deg`).join(', ')})`
</script>

<template>
  <button
    type="button"
    class="more"
    aria-haspopup="dialog"
    :aria-label="COPY.moreColors"
    :title="COPY.moreColors"
    @click="$emit('open')"
  >
    <span class="pizza" :style="{ background: pizza }" aria-hidden="true" />
  </button>
</template>

<style scoped>
.more {
  flex: none;
  display: flex;
  /* Último elemento del carril: deja aire con el borde de la pantalla */
  margin-right: calc(12 * var(--u));
}

.pizza {
  flex: none;
  width: var(--swatch-size);
  height: var(--swatch-size);
  border-radius: 50%;
}
</style>
