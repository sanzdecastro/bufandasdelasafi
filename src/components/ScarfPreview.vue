<script setup lang="ts">
// Bufanda realista: la foto de Figma (15:8249) en dos capas teñidas con filtros SVG
// (ver src/scarf/photo.ts). El mismo SVG genera la imagen de WhatsApp en api/og.ts.
import { computed, ref, watch } from 'vue'
import { useDragScroll } from '../composables/useDragScroll'
import type { YarnColor } from '../data/options'
import { applyDyeParams, dyeParams, scarfPhotoSvg } from '../scarf/photo'

const props = defineProps<{
  base: YarnColor
  fringe: YarnColor | null
  label: string
}>()

// Escritorio: arrastrar la bufanda con el ratón o desplazarla con la rueda
const previewEl = ref<HTMLElement | null>(null)
useDragScroll(previewEl)

// SVG fijo: los colores entran por variables CSS, así cambian (y se animan) sin rehacerlo
const fringeTone = computed(() => props.fringe?.fill ?? props.base.fill)

const svg = scarfPhotoSvg({
  base: 'var(--scarf-base)',
  fringe: 'var(--scarf-fringe)',
  baseTone: props.base.fill,
  fringeTone: fringeTone.value,
  bodyHref: '/scarf/cuerpo.png',
  fringeHref: '/scarf/flecos.png',
  id: 'web',
})

const vars = computed(() => ({
  '--scarf-base': props.base.fill,
  // Sin flecos la capa se oculta; se mantiene un color para que no haya salto al volver
  '--scarf-fringe': fringeTone.value,
}))

// La sombra depende de lo claro que sea cada color: se ajusta en el filtro ya pintado
const photoEl = ref<HTMLElement | null>(null)
watch([() => props.base.fill, fringeTone], ([baseHex, fringeHex]) => {
  if (!photoEl.value) return
  applyDyeParams(photoEl.value, 'web-cuerpo', dyeParams(baseHex))
  applyDyeParams(photoEl.value, 'web-flecos', dyeParams(fringeHex))
})
</script>

<template>
  <div ref="previewEl" class="preview" data-enter="slide-left">
    <div
      ref="photoEl"
      class="photo"
      :class="{ 'no-fringe': !fringe }"
      :style="vars"
      role="img"
      :aria-label="label"
      v-html="svg"
    />
  </div>
</template>

<style scoped>
/* Como en Figma (611 × 458 a x=2): sobresale por la derecha y se recorre en horizontal */
.preview {
  overflow-x: auto;
  padding: 0 calc(2 * var(--u));
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

/* Alto de Figma (458) o el que quede libre en la pantalla, sin deformar la foto */
.photo {
  flex: none;
  height: min(calc(458 * var(--u)), 100%);
  aspect-ratio: 1024 / 768;
  transition:
    --scarf-base 0.5s ease,
    --scarf-fringe 0.5s ease;
}

.photo :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

/* Flecos: al añadirlos crecen desde el borde del cuerpo; al quitarlos se recogen */
.photo :deep(.scarf-fringe) {
  transform-box: fill-box;
  transform-origin: right center;
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease;
}

.photo.no-fringe :deep(.scarf-fringe) {
  transform: scaleX(0.4);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .photo,
  .photo :deep(.scarf-fringe) {
    transition: none;
  }
}
</style>
