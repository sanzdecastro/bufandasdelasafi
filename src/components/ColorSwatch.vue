<script setup lang="ts">
defineProps<{ color: string; name: string; selected: boolean }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="swatch"
    :class="{ selected }"
    :style="{ '--swatch-color': color }"
    :aria-pressed="selected"
    :aria-label="name"
    :title="name"
    @click="$emit('select')"
  />
</template>

<style scoped>
.swatch {
  flex: none;
  width: var(--swatch-size);
  height: var(--swatch-size);
  border-radius: 50%;
  background: var(--swatch-color);
}

/* Seleccionado: anillo negro de 3px por dentro (Figma: r=17, stroke 3) */
.selected {
  box-shadow: inset 0 0 0 calc(3 * var(--u)) var(--color-swatch-ring);
}
</style>
