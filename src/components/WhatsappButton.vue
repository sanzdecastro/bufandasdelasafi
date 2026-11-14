<script setup lang="ts">
// Botón de compra (Figma 3:8068)
import { COPY } from '../data/copy'
import { useScarfConfig } from '../composables/useScarfConfig'
import { useWhatsappOrder } from '../composables/useWhatsappOrder'

const { url } = useWhatsappOrder()
const { price } = useScarfConfig()
</script>

<template>
  <a class="whatsapp" data-enter="slide-up" :href="url" target="_blank" rel="noopener">
    {{ COPY.whatsappButton }} — {{ price }}€
  </a>
</template>

<style scoped>
/*
 * Figma: 380 × 53 en un frame de 393 (7 px a cada lado), 13 px por encima del borde inferior.
 * Todas las medidas son proporcionales (--u), así que siempre cabe en una línea.
 */
.whatsapp {
  flex: none;
  align-self: center;
  margin-bottom: max(calc(13 * var(--u)), env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(8 * var(--u)) calc(24 * var(--u));
  border-radius: calc(48 * var(--u));
  background: var(--color-cta-bg);
  font-size: var(--text-l);
  line-height: normal;
  color: var(--color-cta-text);
  text-decoration: none;
  white-space: nowrap;
}

.whatsapp:active {
  background: rgba(0, 0, 0, 0.16);
}
</style>
