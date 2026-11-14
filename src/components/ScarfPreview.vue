<script setup lang="ts">
// Bufanda en SVG. La geometría (canalé A + B y flecos) está en src/scarf/geometry.ts,
// compartida con la imagen que se genera para WhatsApp.
import { computed, ref } from 'vue'
import { useDragScroll } from '../composables/useDragScroll'
import type { YarnColor } from '../data/options'
import {
  bStitches,
  COLUMN_B_W,
  COLUMN_W,
  FRINGE_COLUMNS,
  HEIGHT,
  RIB_W,
  stitches,
} from '../scarf/geometry'

// Escritorio: arrastrar la bufanda con el ratón o desplazarla con la rueda
const previewEl = ref<HTMLElement | null>(null)
useDragScroll(previewEl)

const props = defineProps<{
  base: YarnColor
  fringe: YarnColor | null
  bodyRibs: number
  label: string
}>()

const fringeWidth = computed(() => (props.fringe ? FRINGE_COLUMNS * COLUMN_W : 0))
const bodyWidth = computed(() => props.bodyRibs * RIB_W)
// Flecos en los dos extremos
const width = computed(() => fringeWidth.value * 2 + bodyWidth.value)

const vars = computed(() => ({
  '--base-fill': props.base.fill,
  '--base-edge': props.base.edge,
  '--base-gap': props.base.gap,
  '--fringe-fill': props.fringe?.fill ?? 'transparent',
  '--scarf-w': width.value,
  '--scarf-h': HEIGHT,
}))
</script>

<template>
  <div ref="previewEl" class="preview" data-enter="slide-left">
    <svg
      class="scarf"
      :width="width"
      :height="HEIGHT"
      :viewBox="`0 0 ${width} ${HEIGHT}`"
      :style="vars"
      role="img"
      :aria-label="label"
    >
      <defs>
        <g id="scarf-col-body">
          <rect
            v-for="(s, i) in stitches"
            :key="i"
            x="0.5"
            :y="s.y + 0.5"
            width="9"
            :height="s.h - 1"
            :rx="(s.h - 1) / 2"
            style="fill: var(--base-fill); stroke: var(--base-edge); stroke-width: 1"
          />
        </g>
        <g id="scarf-col-body-b">
          <rect
            v-for="(s, i) in bStitches"
            :key="i"
            x="0.5"
            :y="s.y + 0.5"
            :width="COLUMN_B_W - 1"
            :height="s.h - 1"
            :rx="(COLUMN_B_W - 1) / 2"
            style="fill: var(--base-fill); stroke: var(--base-edge); stroke-width: 1"
          />
        </g>
        <g id="scarf-col-fringe">
          <template v-for="(s, i) in stitches" :key="i">
            <!-- Flecos sin borde: la cápsula ocupa su caja entera (10 × 5–6) -->
            <rect
              v-if="i % 2 === 0"
              x="0"
              :y="s.y"
              width="10"
              :height="s.h"
              :rx="s.h / 2"
              style="fill: var(--fringe-fill)"
            />
          </template>
        </g>
      </defs>

      <template v-if="fringe">
        <g class="fringe fringe-start">
          <g class="grow grow-start">
            <use v-for="c in FRINGE_COLUMNS" :key="c" href="#scarf-col-fringe" :x="(c - 1) * COLUMN_W" />
          </g>
        </g>
        <g class="fringe fringe-end" :transform="`translate(${fringeWidth + bodyWidth} 0)`">
          <g class="grow grow-end">
            <use v-for="c in FRINGE_COLUMNS" :key="c" href="#scarf-col-fringe" :x="(c - 1) * COLUMN_W" />
          </g>
        </g>
      </template>

      <g class="body" :transform="`translate(${fringeWidth} 0)`">
        <rect x="3" y="4" :width="bodyWidth - 6" :height="HEIGHT - 6" style="fill: var(--base-gap)" />
        <template v-for="r in bodyRibs" :key="r">
          <use href="#scarf-col-body" :x="(r - 1) * RIB_W" />
          <use href="#scarf-col-body-b" :x="(r - 1) * RIB_W + COLUMN_W" />
        </template>
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* La bufanda es más ancha que la pantalla: se desplaza en horizontal, como en el diseño */
.preview {
  overflow-x: auto;
  padding: 0 calc(42 * var(--u));
  scrollbar-width: none;
}

@media (hover: hover) and (pointer: fine) {
  .preview {
    cursor: grab;
  }

  .preview.is-dragging {
    cursor: grabbing;
    user-select: none;
  }
}

.preview::-webkit-scrollbar {
  display: none;
}

/* Siempre a tamaño real: nunca se encoge para caber, se recorre con scroll */
.scarf {
  display: block;
  flex: none;
  /* Dibujada en px de Figma (viewBox); se escala con la unidad proporcional */
  width: calc(var(--scarf-w) * var(--u));
  height: calc(var(--scarf-h) * var(--u));
}

/* Al añadir flecos, crecen desde los extremos del cuerpo hacia fuera */
.grow {
  transform-box: fill-box;
  animation: fringe-grow 0.45s ease-out;
}

.grow-start {
  transform-origin: right center;
}

.grow-end {
  transform-origin: left center;
}

@keyframes fringe-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .grow {
    animation: none;
  }
}
</style>
