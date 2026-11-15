<script setup lang="ts">
// Intro (Figma 1:591 → 1:536). Secuencia:
//   1. Se dibuja la firma «Safi», rasgo a rasgo, en orden de escritura (de abajo arriba).
//   2. Las palabras se escriben a máquina: primero las letras más cercanas a Safi, luego
//      las de los extremos.
//   3. Cada «BUFANDAS» se transforma, letra a letra y con stagger entre palabras, en la del
//      segundo frame: BUFANDAS → HECHAS POR → SAFI / BUFANDAS → DESDE → EL SOFA.
// Un toque en cualquier momento salta la intro. Con «reducir movimiento» se muestra el
// estado final directamente.
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import firmaRaw from '../assets/figma/safi-firma-intro.svg?raw'
import trazoRaw from '../assets/figma/safi-firma-intro-trazo.svg?raw'
import { drawSignatureSvgs } from '../composables/useSignatureDraw'

const emit = defineEmits<{ done: [] }>()

// SVG en línea, en el color de marca del tema (currentColor)
const tint = (svg: string) => svg.replace(/#045DB9/gi, 'currentColor')
const firmaSvg = tint(firmaRaw)
const trazoSvg = tint(trazoRaw)

const FRAME_1 = { top: ['BUFANDAS', 'BUFANDAS', 'BUFANDAS'], bottom: ['BUFANDAS', 'BUFANDAS', 'BUFANDAS'] }
const FRAME_2 = { top: ['BUFANDAS', 'HECHAS POR', 'SAFI'], bottom: ['BUFANDAS', 'DESDE', 'EL SOFA'] }

// Tiempos (ms)
const T = {
  draw: 600, // firma completa
  afterDraw: 250,
  letter: 70, // typewriter
  hold: 800, // pausa para leer el primer frame
  morphLetter: 55, // cambio de cada letra
  morphStagger: 650, // entre palabras que se transforman
  end: 1500, // pausa final antes de pasar al builder
}

/**
 * Palabras. `nearStart`: la parte de la palabra pegada a Safi es su inicio (grupo de arriba,
 * que se lee de abajo arriba empezando junto a la firma) o su final (grupo de abajo).
 * `shown`: cuántas letras son visibles contando desde el lado de Safi.
 */
interface Word {
  text: string
  shown: number
  nearStart: boolean
}
const words = reactive({
  top: FRAME_1.top.map((text) => ({ text, shown: 0, nearStart: true }) as Word),
  bottom: FRAME_1.bottom.map((text) => ({ text, shown: 0, nearStart: false }) as Word),
})

function isVisible(w: Word, i: number): boolean {
  return w.nearStart ? i < w.shown : i >= w.text.length - w.shown
}

/** Paso k de la transformación src → tgt, cambiando letras desde el lado de Safi */
function morph(src: string, tgt: string, k: number, nearStart: boolean): string {
  if (nearStart) return tgt.slice(0, k) + src.slice(k)
  return src.slice(0, Math.max(0, src.length - k)) + tgt.slice(Math.max(0, tgt.length - k))
}

// --- Secuencia ---------------------------------------------------------------------------
const firmaEl = ref<HTMLElement | null>(null)
const trazoEl = ref<HTMLElement | null>(null)
let cancelled = false
const running: Animation[] = []

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

/** Dibuja la firma de la intro (ver useSignatureDraw) */
async function drawSignature() {
  const svgs = [firmaEl.value, trazoEl.value]
    .map((el) => el?.querySelector('svg'))
    .filter((s): s is SVGSVGElement => !!s)
  await drawSignatureSvgs(svgs, T.draw, () => cancelled, running)
}

/** Máquina de escribir: todas las palabras a la vez, desde Safi hacia los extremos */
async function typewrite() {
  const all = [...words.top, ...words.bottom]
  const max = Math.max(...all.map((w) => w.text.length))
  for (let k = 1; k <= max && !cancelled; k++) {
    all.forEach((w) => (w.shown = Math.min(k, w.text.length)))
    await sleep(T.letter)
  }
}

/** Cada palabra que cambia se transforma letra a letra; entre palabras, stagger */
async function morphToFrame2() {
  const jobs: Promise<void>[] = []
  const changes = (['top', 'bottom'] as const).flatMap((group) =>
    words[group].map((w, i) => ({ w, target: FRAME_2[group][i]! })).filter((c) => c.w.text !== c.target),
  )
  for (const { w, target } of changes) {
    if (cancelled) return
    const src = w.text
    const steps = Math.max(src.length, target.length)
    jobs.push(
      (async () => {
        for (let k = 1; k <= steps && !cancelled; k++) {
          w.text = morph(src, target, k, w.nearStart)
          w.shown = w.text.length
          await sleep(T.morphLetter)
        }
      })(),
    )
    await sleep(T.morphStagger)
  }
  await Promise.all(jobs)
}

function showFinal() {
  ;(['top', 'bottom'] as const).forEach((group) =>
    words[group].forEach((w, i) => {
      w.text = FRAME_2[group][i]!
      w.shown = w.text.length
    }),
  )
}

async function play() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showFinal()
    await sleep(T.end)
  } else {
    await drawSignature()
    await sleep(T.afterDraw)
    await typewrite()
    await sleep(T.hold)
    await morphToFrame2()
    await sleep(T.end)
  }
  if (!cancelled) finish()
}

function finish() {
  if (cancelled) return
  cancelled = true
  emit('done')
}

onMounted(play)

onBeforeUnmount(() => {
  cancelled = true
  running.forEach((a) => a.cancel())
})
</script>

<template>
  <section class="intro" aria-label="Bufandas Safi" @click="finish">
    <div class="stage">
      <span ref="firmaEl" class="firma" aria-hidden="true" v-html="firmaSvg" />

      <div class="words" aria-hidden="true">
        <p class="column-group top">
          <span v-for="(w, wi) in words.top" :key="wi" class="word">
            <span v-for="(ch, i) in w.text" :key="i" :class="{ hidden: !isVisible(w, i) }">{{ ch }}</span>
          </span>
        </p>
        <p class="column-group bottom">
          <span v-for="(w, wi) in words.bottom" :key="wi" class="word">
            <span v-for="(ch, i) in w.text" :key="i" :class="{ hidden: !isVisible(w, i) }">{{ ch }}</span>
          </span>
        </p>
      </div>

      <span ref="trazoEl" class="trazo" aria-hidden="true" v-html="trazoSvg" />
    </div>
    <button class="visually-hidden" type="button" @click.stop="finish">Saltar intro</button>
  </section>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  background: var(--color-bg);
  cursor: pointer;
}

/* Composición del Figma: caja de 179.6 × 612 con los elementos en posición absoluta */
.stage {
  position: relative;
  width: calc(179.609 * var(--u));
  height: calc(612 * var(--u));
  color: var(--color-brand);
}

.firma {
  position: absolute;
  inset: 0;
  display: block;
}

.trazo {
  position: absolute;
  left: calc(28 * var(--u));
  top: calc(360 * var(--u));
  width: calc(110 * var(--u));
  height: calc(94.1938 * var(--u));
  display: block;
}

/* Los SVG en línea ocupan su caja (traen width/height de Figma) */
.firma :deep(svg),
.trazo :deep(svg) {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.words {
  position: absolute;
  inset: 0;
}

.column-group {
  position: absolute;
  margin: 0;
  display: flex;
  gap: calc(0.06 * var(--u));
  font-size: var(--text-intro);
  line-height: calc(37 * var(--u));
  color: var(--color-brand);
  white-space: pre;
}

/* Texto vertical leído de abajo arriba (rotate -90 en Figma) */
.word {
  display: block;
  width: calc(37 * var(--u));
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

/* Letra aún no escrita: ocupa su sitio para que el resto no se mueva */
.hidden {
  visibility: hidden;
}

.top {
  left: calc(34.21 * var(--u));
  bottom: calc(calc(612 * var(--u)) - calc(166 * var(--u)));
  align-items: flex-end;
}

.top .word {
  text-align: start;
}

.bottom {
  left: calc(35 * var(--u));
  top: calc(476 * var(--u));
  align-items: flex-start;
}

.bottom .word {
  text-align: end;
}
</style>
