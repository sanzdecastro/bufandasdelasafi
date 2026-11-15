<script setup lang="ts">
// Bajo la bufanda (Figma 15:8273): descripción + «Base DMC 7133 · Flecos DMC 7135»
import { COPY } from '../data/copy'
import type { YarnColor } from '../data/options'

defineProps<{ base: YarnColor; fringe: YarnColor | null }>()
</script>

<template>
  <div class="caption">
    <p class="description">{{ COPY.scarfDescription }}</p>
    <p class="colors" aria-live="polite">
      <span class="item">
        <span class="label">{{ COPY.labels.baseColor }}</span>{{ ' ' }}<span class="code">{{ base.name }}</span>
      </span>
      <span class="item">
        <template v-if="fringe">
          <span class="label">{{ COPY.labels.fringeColor }}</span>{{ ' ' }}<span class="code">{{ fringe.name }}</span>
        </template>
        <span v-else class="label">{{ COPY.labels.noFringe }}</span>
      </span>
    </p>
  </div>
</template>

<style scoped>
/* Figma: columna con 12 px a los lados y 10 px entre la descripción y los colores */
.caption {
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--u));
  padding: 0 calc(12 * var(--u));
  color: var(--color-brand);
}

.caption p {
  margin: 0;
}

/* Descripción: Arimo 16 px a todo el ancho (dos líneas en el diseño) */
.description {
  font-family: var(--font-caption);
  font-size: var(--text-description);
  line-height: var(--leading-description);
}

/* Colores: dos mitades iguales; etiqueta Offset TM 24 px + código Arimo 20 px */
.colors {
  display: flex;
  font-family: var(--font-display);
  font-size: var(--text-caption);
  line-height: normal;
}

.item {
  flex: 1 1 0;
  min-width: 0;
  white-space: nowrap;
}

.label {
  font-size: var(--text-caption-label);
}

.code {
  font-family: var(--font-caption);
  font-weight: 400;
}
</style>
