<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import IntroScreen from './components/IntroScreen.vue'
import ScarfBuilder from './components/ScarfBuilder.vue'
import { useScarfConfig } from './composables/useScarfConfig'
import { applyTheme, computeTheme } from './composables/useTheme'

// La intro se cierra en seco (sin fundido) y la home arranca su animación de entrada
const introDone = ref(false)

// Los colores de la web siguen a la combinación elegida (al entrar, la propuesta aleatoria)
const { baseColor, fringeColor } = useScarfConfig()
watchEffect(() => applyTheme(computeTheme(baseColor.value.fill, fringeColor.value?.fill ?? null)))

// La transición de colores se activa después del primer pintado
onMounted(() =>
  requestAnimationFrame(() => document.documentElement.classList.add('theme-ready')),
)
</script>

<template>
  <ScarfBuilder :play="introDone" />
  <IntroScreen v-if="!introDone" @done="introDone = true" />
</template>
