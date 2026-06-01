<script setup lang="ts">
defineProps<{ name: string; size?: number | string }>()
</script>

<template>
  <svg class="svg-icon" :width="size || 24" :height="size || 24">
    <use :href="`/PolicyQuest/icons.svg#icon-${name}`" />
  </svg>
</template>

<style scoped>
.svg-icon { display: inline-block; vertical-align: middle; fill: none; }
</style>
