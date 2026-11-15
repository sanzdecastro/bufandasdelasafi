<script setup lang="ts">
// Builder (Figma 1:629)
import { computed, nextTick, ref, watch } from 'vue'
import { LENGTHS, findColor } from '../data/options'
import { suggestBaseColors, suggestFringeColors } from '../data/proposal'
import { COPY } from '../data/copy'
import { useScarfConfig } from '../composables/useScarfConfig'
import BuilderHeader from './BuilderHeader.vue'
import OptionRow from './OptionRow.vue'
import TextOption from './TextOption.vue'
import ColorSwatch from './ColorSwatch.vue'
import MoreColorsButton from './MoreColorsButton.vue'
import PaletteSheet from './PaletteSheet.vue'
import ScarfPreview from './ScarfPreview.vue'
import WhatsappButton from './WhatsappButton.vue'

const { state, length, baseColor, fringeColor } = useScarfConfig()

const previewLabel = computed(
  () =>
    `Bufanda de ${length.value.label}, color ${baseColor.value.name}, ` +
    (fringeColor.value ? `flecos ${fringeColor.value.name}` : 'sin flecos'),
)

// Color base: el elegido primero y 6 de su familia (se recalculan al cambiar la base)
const baseOptions = computed(() => [baseColor.value, ...suggestBaseColors(baseColor.value.id)])

// Flecos: «igual que la base», 3 en gama y 3 complementarios. Si el elegido no está entre
// ellos (p. ej. venía del panel), se muestra delante para que siempre esté a la vista.
const fringeSuggestions = computed(() => suggestFringeColors(baseColor.value.id))
const fringeExtra = computed(() => {
  const f = fringeColor.value
  if (!f || f.id === baseColor.value.id) return null
  const { gamut, complementary } = fringeSuggestions.value
  return [...gamut, ...complementary].some((c) => c.id === f.id) ? null : f
})

// Panel de cartas DMC
const props = defineProps<{ play: boolean }>()

// --- Entrada de la home (al terminar la intro) -------------------------------------------
// Retardos (ms). Ver src/styles/enter.css para cada animación.
const ENTER = {
  headerLines: 120, // primera línea de la cabecera
  lineStagger: 120,
  rows: 420, // primera fila de opciones
  rowStagger: 150,
  itemStagger: 35, // opciones dentro de cada fila (etiqueta primero)
  maxItems: 10, // las que quedan fuera de pantalla no alargan la entrada
  scarf: 800,
  button: 1000,
  total: 2200, // después se quita .entering
}

const root = ref<HTMLElement | null>(null)

function setDelay(el: Element | null | undefined, ms: number, kind?: string) {
  if (!(el instanceof HTMLElement)) return
  if (kind) el.dataset.enter = kind
  el.style.setProperty('--enter-delay', `${Math.round(ms)}ms`)
}

watch(
  () => props.play,
  async (play) => {
    const el = root.value
    if (!play || !el) return
    el.querySelectorAll('.header [data-enter]').forEach((line, i) =>
      setDelay(line, ENTER.headerLines + i * ENTER.lineStagger),
    )
    el.querySelectorAll('.options [role="group"]').forEach((row, r) => {
      const start = ENTER.rows + r * ENTER.rowStagger
      setDelay(row.querySelector('.label'), start)
      Array.from(row.querySelector('.options')?.children ?? []).forEach((item, j) =>
        setDelay(item, start + (Math.min(j, ENTER.maxItems) + 1) * ENTER.itemStagger, 'fade'),
      )
    })
    setDelay(el.querySelector('[data-enter="slide-left"]'), ENTER.scarf)
    setDelay(el.querySelector('[data-enter="slide-up"]'), ENTER.button)
    el.classList.add('entering')
    await nextTick()
    window.setTimeout(() => {
      el.classList.remove('entering')
      el.querySelectorAll<HTMLElement>('[data-enter]').forEach((n) => {
        n.style.removeProperty('--enter-delay')
      })
    }, ENTER.total)
  },
)

const sheet = ref<'base' | 'fringe' | null>(null)
function pickFromSheet(id: string) {
  if (!findColor(id)) return
  if (sheet.value === 'base') state.baseColorId = id
  else state.fringeColorId = id
}
</script>

<template>
  <main ref="root" class="builder">
    <div class="top">
      <BuilderHeader :play="play" />

      <!-- Figma 3:8154: Largo · Color base · Color flecos (filas de 37 px) -->
      <div class="options">
        <OptionRow :label="COPY.labels.length" gap="text">
          <TextOption
            v-for="l in LENGTHS"
            :key="l.id"
            :selected="state.lengthId === l.id"
            @select="state.lengthId = l.id"
          >
            {{ l.label }}
          </TextOption>
        </OptionRow>

        <OptionRow :label="COPY.labels.baseColor">
          <ColorSwatch
            v-for="c in baseOptions"
            :key="c.id"
            :color="c.fill"
            :name="c.name"
            :selected="state.baseColorId === c.id"
            @select="state.baseColorId = c.id"
          />
          <MoreColorsButton @open="sheet = 'base'" />
        </OptionRow>

        <OptionRow :label="COPY.labels.fringeColor">
          <TextOption :selected="state.fringeColorId === null" @select="state.fringeColorId = null">
            {{ COPY.labels.noFringe }}
          </TextOption>
          <ColorSwatch
            v-if="fringeExtra"
            :color="fringeExtra.fill"
            :name="fringeExtra.name"
            :selected="true"
            @select="state.fringeColorId = fringeExtra.id"
          />
          <ColorSwatch
            :color="baseColor.fill"
            :name="`${COPY.sameAsBase} (${baseColor.name})`"
            :selected="state.fringeColorId === baseColor.id"
            @select="state.fringeColorId = baseColor.id"
          />
          <ColorSwatch
            v-for="c in fringeSuggestions.gamut"
            :key="`g-${c.id}`"
            :color="c.fill"
            :name="c.name"
            :selected="state.fringeColorId === c.id"
            @select="state.fringeColorId = c.id"
          />
          <span
            v-if="fringeSuggestions.complementary.length"
            class="divider"
            aria-hidden="true"
          />
          <ColorSwatch
            v-for="c in fringeSuggestions.complementary"
            :key="`c-${c.id}`"
            :color="c.fill"
            :name="c.name"
            :selected="state.fringeColorId === c.id"
            @select="state.fringeColorId = c.id"
          />
          <MoreColorsButton @open="sheet = 'fringe'" />
        </OptionRow>
      </div>
    </div>

    <ScarfPreview
      class="scarf"
      :base="baseColor"
      :fringe="fringeColor"
      :label="previewLabel"
    />

    <WhatsappButton />

    <Transition name="sheet">
      <PaletteSheet
        v-if="sheet"
        :title="sheet === 'base' ? COPY.sheet.base : COPY.sheet.fringe"
        :selected-id="sheet === 'base' ? state.baseColorId : state.fringeColorId"
        @select="pickFromSheet"
        @close="sheet = null"
      />
    </Transition>
  </main>
</template>

<style scoped>
/* La app nunca pasa de 100svh: todo cabe en una pantalla y los huecos se reparten */
.builder {
  position: relative;
  height: 100svh;
  display: flex;
  flex-direction: column;
  overflow: clip;
}

/* Figma 3:8155: 18 px arriba, 53 px entre cabecera y opciones */
.top {
  flex: none;
  padding-top: calc(18 * var(--u));
  display: flex;
  flex-direction: column;
  /* En pantallas más bajas que el diseño este hueco se recorta primero, hasta 16 px */
  gap: clamp(calc(16 * var(--u)), calc(100svh - calc(653 * var(--u))), calc(53 * var(--u)));
}

/* Figma 3:8154: etiquetas en x=11 y opciones desde 145 px; los carriles llegan al borde */
.options {
  min-width: 0;
}

/* La bufanda ocupa el espacio restante, centrada en vertical */
.scarf {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
}

/* Separación entre flecos en gama y complementarios */
.divider {
  flex: none;
  width: calc(1 * var(--u));
  height: calc(24 * var(--u));
  margin: 0 calc(4 * var(--u));
  background: var(--color-brand);
  opacity: 0.35;
}

/* Panel de cartas: sube desde abajo */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-enter-active :deep(.sheet),
.sheet-leave-active :deep(.sheet) {
  transition: transform 0.3s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from :deep(.sheet),
.sheet-leave-to :deep(.sheet) {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active :deep(.sheet),
  .sheet-leave-active :deep(.sheet) {
    transition: none;
  }
}
</style>
