<script setup lang="ts">
// «+ colores»: abre el panel con las 20 cartas DMC. La pizza resume la variedad de la carta.
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
  <button type="button" class="more" aria-haspopup="dialog" @click="$emit('open')">
    <span class="pizza" :style="{ background: pizza }" aria-hidden="true" />
    <span class="text">{{ COPY.moreColors }}</span>
  </button>
</template>

<style scoped>
.more {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--swatch-gap);
  padding-right: calc(12 * var(--u));
  font-size: var(--text-l);
  line-height: normal;
  color: var(--color-brand);
  white-space: nowrap;
}

.pizza {
  flex: none;
  width: var(--swatch-size);
  height: var(--swatch-size);
  border-radius: 50%;
}
</style>
