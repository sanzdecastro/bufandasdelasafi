<script setup lang="ts">
// Bufanda realista: la foto de Figma (15:8249) en dos capas teñidas con filtros SVG
// (ver src/scarf/photo.ts). El mismo SVG genera la imagen de WhatsApp en api/og.ts.
import { computed, ref, watch } from 'vue'
import { useDragScroll } from '../composables/useDragScroll'
import type { YarnColor } from '../data/options'
import { PHOTO_H, applyDyeParams, dyeParams, scarfLayout, scarfPhotoSvg } from '../scarf/photo'

const props = defineProps<{
  base: YarnColor
  fringe: YarnColor | null
  /** Largo en cm: la bufanda se ve entera y más larga o más corta */
  lengthCm: number
  label: string
}>()

// Escritorio: arrastrar la bufanda con el ratón o desplazarla con la rueda
const previewEl = ref<HTMLElement | null>(null)
useDragScroll(previewEl)

// SVG fijo: los colores entran por variables CSS, así cambian (y se animan) sin rehacerlo
const fringeTone = computed(() => props.fringe?.fill ?? props.base.fill)

// Solo se rehace al cambiar el largo (con la sombra del color de ese momento)
const buildSvg = (lengthCm: number) =>
  scarfPhotoSvg({
    base: 'var(--scarf-base)',
    fringe: 'var(--scarf-fringe)',
    baseTone: props.base.fill,
    fringeTone: fringeTone.value,
    bodyHref: '/scarf/cuerpo.png',
    fringeHref: '/scarf/flecos.png',
    shadow: 'var(--color-brand)',
    lengthCm,
    id: 'web',
  })
const svg = ref(buildSvg(props.lengthCm))
watch(
  () => props.lengthCm,
  (cm) => (svg.value = buildSvg(cm)),
)
const aspect = computed(() => `${scarfLayout(props.lengthCm).width} / ${PHOTO_H}`)

const vars = computed(() => ({
  aspectRatio: aspect.value,
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
/*
 * Figma 15:8254: marco de 393 × 398 que recorta la foto (611 × 458, a la izquierda y
 * centrada en vertical por ScarfBuilder). Lo que sobresale a la derecha se puede desplazar.
 */
.preview {
  overflow-x: auto;
  overflow-y: hidden;
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

/* 458 / 398 del alto del marco: a 852 de alto son los 458 px de Figma; si el marco se
   encoge en pantallas bajas, la foto se reduce en la misma proporción */
.photo {
  flex: none;
  height: calc(100% * 458 / 398);
  /* aspect-ratio: según el largo (scarfLayout), en línea */
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
