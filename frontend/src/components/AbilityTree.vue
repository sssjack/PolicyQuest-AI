<script setup lang="ts">
import StarRating from './StarRating.vue'
import type { AbilityNode } from '../data/abilityRating'
withDefaults(defineProps<{ nodes: AbilityNode[]; nested?: boolean }>(), { nested: false })
</script>

<template>
  <div class="ability-tree" :class="{ nested }">
    <p v-if="!nested" class="rating-guide">五星共十级，每半颗星一级 · 点击分类展开维度</p>
    <template v-for="node in nodes" :key="node.id">
      <details v-if="node.children?.length" class="tree-branch">
        <summary class="tree-row">
          <span class="node-info"><span class="chevron" aria-hidden="true">›</span><span><strong>{{ node.name }}</strong><small>{{ node.count }} 次评分样本</small></span></span>
          <StarRating :score="node.score" />
        </summary>
        <AbilityTree :nodes="node.children" nested />
      </details>
      <div v-else class="tree-row tree-leaf">
        <span class="node-info"><span class="leaf-dot" aria-hidden="true"/><span><strong>{{ node.name }}</strong><small>{{ node.count ? `${node.count} 次评分样本` : '完成批改后点亮星级' }}</small></span></span>
        <StarRating :score="node.score" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.ability-tree{width:100%;min-width:0}.rating-guide{margin:12px 0;color:#8492a6;font-size:12px;line-height:1.7}.tree-branch,.tree-leaf{border-bottom:1px solid #edf1f7}.tree-branch:last-child,.tree-leaf:last-child{border-bottom:0}.tree-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 4px;list-style:none}.tree-row::-webkit-details-marker{display:none}summary.tree-row{cursor:pointer;border-radius:8px}summary.tree-row:hover{background:#f7faff}summary.tree-row:focus-visible{outline:2px solid #397cff;outline-offset:2px}.node-info{display:flex;align-items:center;gap:13px;min-width:0}.node-info strong{display:block;color:#263b56;font-size:16px;line-height:1.5;overflow-wrap:anywhere}.node-info small{display:block;color:#8c9ab0;font-size:12px;margin-top:4px}.chevron{display:grid;place-items:center;width:23px;height:23px;border-radius:50%;background:#edf4ff;color:#377cf7;font-size:24px;line-height:1;flex-shrink:0;transition:transform .15s}.tree-branch[open]>.tree-row .chevron{transform:rotate(90deg)}.nested{box-sizing:border-box;width:calc(100% - 15px);margin-left:15px;padding-left:16px;border-left:1px solid #dce7f5}.nested .tree-row{padding:16px 4px}.nested .node-info strong{font-size:14px;font-weight:600}.leaf-dot{width:7px;height:7px;margin:0 8px;background:#a9bdda;border-radius:50%;flex-shrink:0}@media(max-width:600px){.tree-row{align-items:flex-start;flex-direction:column;gap:10px;padding:17px 0}.tree-row>.star-rating{margin-left:36px}.nested{margin-left:10px;padding-left:10px;width:calc(100% - 10px)}.nested .tree-row>.star-rating{margin-left:0}.node-info{gap:9px}}
</style>
