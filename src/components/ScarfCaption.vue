<script setup lang="ts">
// Bajo la bufanda (Figma 15:8273): descripción + «Base DMC 7133 · Flecos DMC 7135»
import { ref } from 'vue'
import { Shuffle } from 'lucide-vue-next'
import { COPY } from '../data/copy'
import type { YarnColor } from '../data/options'
import { hapticTick } from '../composables/useHaptics'
import { useScarfConfig } from '../composables/useScarfConfig'

defineProps<{ base: YarnColor; fringe: YarnColor | null }>()

const { shuffleColors } = useScarfConfig()

// El icono gira media vuelta en cada pulsación
const turns = ref(0)
function shuffle() {
  shuffleColors()
  turns.value += 1
  hapticTick()
}
</script>

<template>
  <div class="caption">
    <button type="button" class="shuffle" @click="shuffle">
      <Shuffle
        class="shuffle-icon"
        :style="{ transform: `rotate(${turns * 180}deg)` }"
        aria-hidden="true"
      />
      <span class="shuffle-text">{{ COPY.shuffle }}</span>
    </button>
    <p class="description">
      {{ COPY.scarfDescription.lead }} <strong>{{ COPY.scarfDescription.strong }}</strong><br />{{
        COPY.scarfDescription.rest
      }}
    </p>
    <p class="colors" aria-live="polite">
      <span class="item">
        <span class="label">{{ COPY.labels.baseColor }}</span>{{ ' ' }}<span class="code"
          ><span class="dot" :style="{ background: base.fill }" aria-hidden="true" /><span class="code-text">{{ base.name }}</span></span
        >
      </span>
      <span class="item">
        <template v-if="fringe">
          <span class="label">{{ COPY.labels.fringeColor }}</span>{{ ' ' }}<span class="code"
            ><span class="dot" :style="{ background: fringe.fill }" aria-hidden="true" /><span class="code-text">{{ fringe.name }}</span></span
          >
        </template>
        <span v-else class="label">{{ COPY.labels.noFringe }}</span>
      </span>
    </p>
  </div>
</template>

<style scoped>
/* Figma: columna con 12 px a los lados y 10 px entre la descripción y los colores */
.caption {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--u));
  padding: 0 calc(12 * var(--u));
  color: var(--color-brand);
  padding-bottom: 12px;
}

.caption p {
  margin: 0;
}

/*
 * «Otros colores»: enlace en la primera línea de la descripción, a la derecha (la primera
 * línea es corta y deja sitio). Mismo tamaño que la descripción, subrayado como los enlaces.
 */
.shuffle {
  position: absolute;
  top: 0;
  right: calc(12 * var(--u));
  display: flex;
  align-items: center;
  gap: calc(4 * var(--u));
  font-family: var(--font-caption);
  font-size: var(--text-description);
  line-height: var(--leading-description);
  color: var(--color-brand);
}

.shuffle-text {
  text-decoration: underline;
  text-decoration-thickness: from-font;
  text-underline-position: from-font;
}

.shuffle-icon {
  flex: none;
  width: calc(14 * var(--u));
  height: calc(14 * var(--u));
  stroke-width: 1.75;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Área táctil mayor que el texto, sin mover nada */
.shuffle::after {
  content: '';
  position: absolute;
  inset: calc(-10 * var(--u)) calc(-8 * var(--u));
}

@media (prefers-reduced-motion: reduce) {
  .shuffle-icon {
    transition: none;
  }
}

/* Descripción: Arimo 14 px a todo el ancho, en dos líneas */
.description strong {
  font-weight: 700;
}

.description {
  font-family: var(--font-caption);
  font-size: var(--text-description);
  line-height: var(--leading-description);
}

/*
 * Colores (Figma 15:8291): dos mitades iguales. Cada una: etiqueta Offset TM 18 px, 8 px,
 * punto de 11 px con el color elegido, 2 px y código Arimo 14 px recortado a la altura de
 * las mayúsculas (11 px), todo centrado en vertical.
 */
.colors {
  display: flex;
  font-family: var(--font-display);
  font-size: var(--text-caption);
  line-height: normal;
}

.item {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: calc(8 * var(--u));
  white-space: nowrap;
}

.label {
  font-size: var(--text-caption-label);
}

.code {
  display: flex;
  align-items: center;
  gap: calc(2 * var(--u));
  font-family: var(--font-caption);
  font-weight: 400;
}

.code-text {
  display: block;
  text-box: trim-both cap alphabetic;
}

/* Sin text-box (Firefox): mismo recorte con los márgenes de Arimo */
@supports not (text-box: trim-both cap alphabetic) {
  .code-text {
    margin-top: -0.205em;
    margin-bottom: -0.228em;
  }
}

.dot {
  flex: none;
  width: calc(11 * var(--u));
  height: calc(11 * var(--u));
  border-radius: 50%;
  transition: background-color 0.5s ease;
}
</style>
