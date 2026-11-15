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
    <span class="whatsapp-text">{{ COPY.whatsappButton }} — {{ price }}€</span>
  </a>
</template>

<style scoped>
/*
 * Figma 3:8068: 380 × 53 en un frame de 393 (7 px a cada lado), 13 px por encima del borde
 * inferior. Fondo con el color de marca y texto con el de resaltado (los dos del tema, que
 * garantiza contraste AA entre ellos). Texto recortado a la altura de las mayúsculas (21 px)
 * con 16 px arriba y abajo.
 */
.whatsapp {
  flex: none;
  align-self: center;
  /* Abajo del todo: el hueco libre queda entre el resumen y el botón */
  margin-top: auto;
  margin-bottom: max(calc(13 * var(--u)), env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(16 * var(--u)) calc(24 * var(--u));
  border-radius: calc(48 * var(--u));
  background: var(--color-cta-bg);
  font-size: var(--text-l);
  line-height: normal;
  color: var(--color-cta-text);
  text-decoration: none;
  white-space: nowrap;
}

.whatsapp-text {
  display: block;
  line-height: 0.9997;
  text-box: trim-both cap alphabetic;
}

/* Sin text-box (Firefox): mismo recorte con los márgenes medidos para Offset TM */
@supports not (text-box: trim-both cap alphabetic) {
  .whatsapp-text {
    margin-top: -0.1434em;
    margin-bottom: -0.1405em;
  }
}

.whatsapp:active {
  filter: brightness(0.9);
}
</style>
