<script setup lang="ts">
defineProps<{ selected: boolean }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="text-option"
    :class="{ selected }"
    :aria-pressed="selected"
    @click="$emit('select')"
  >
    <slot />
  </button>
</template>

<style scoped>
.text-option {
  flex: none;
  font-size: var(--text-l);
  line-height: normal;
  color: var(--color-brand);
  white-space: nowrap;
}

.selected {
  background: var(--color-highlight);
  text-decoration: underline;
  text-decoration-thickness: from-font;
  text-underline-position: from-font;
}
</style>
