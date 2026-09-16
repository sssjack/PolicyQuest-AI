<script setup lang="ts">
import { computed } from 'vue'
import { starLevel } from '../data/abilityRating'
const props = defineProps<{ score: number | null; compact?: boolean }>()
const level = computed(() => starLevel(props.score))
const label = computed(() => props.score == null ? '暂无评分' : `${level.value / 2}星，${level.value} / 10级`)
</script>

<template>
  <span class="star-rating" :class="{ compact }" role="img" :aria-label="label" :title="label">
    <span v-for="i in 5" :key="i" class="star" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z" /></svg>
      <span class="fill" :style="{ width: `${Math.max(0, Math.min(2, level - (i - 1) * 2)) * 50}%` }">
        <svg viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z" /></svg>
      </span>
    </span>
    <span v-if="!compact" class="rating-label" aria-hidden="true">{{ score == null ? '暂无评分' : `${level} / 10级` }}</span>
  </span>
</template>

<style scoped>
.star-rating{--star-size:24px;display:inline-flex;align-items:center;gap:4px;flex-shrink:0;white-space:nowrap}.star{position:relative;display:block;width:var(--star-size);height:var(--star-size);flex-shrink:0}.star svg{display:block;width:var(--star-size);height:var(--star-size);fill:#dce2eb}.fill{position:absolute;left:0;top:0;height:100%;overflow:hidden}.fill svg{fill:#f5b82e}.rating-label{margin-left:10px;color:#64748b;font-size:12px;font-weight:500}.compact{--star-size:17px;gap:2px}@media(max-width:600px){.star-rating{--star-size:21px;gap:3px}.compact{--star-size:15px;gap:1px}.rating-label{margin-left:6px}}
</style>
