<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
const props = defineProps<{ items: Array<{ name: string; score: number | null }> }>()
const element = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let observer: ResizeObserver | undefined
function render() {
  if (!element.value) return
  chart ||= echarts.init(element.value)
  const items = props.items.filter(x => x.score !== null)
  chart.setOption({ tooltip: { trigger: 'item' }, radar: { indicator: items.map(x => ({ name: x.name, max: 10 })), radius: '62%',
    axisName: { color: '#607087', fontSize: 11 }, splitArea: { areaStyle: { color: ['#f6f9ff', '#edf3ff'] } },
    splitLine: { lineStyle: { color: '#dce5f4' } } }, series: [{ type: 'radar', data: [{ value: items.map(x => x.score), name: '本卷能力观察（10分制）' }],
    lineStyle: { color: '#3265f5', width: 2 }, itemStyle: { color: '#3265f5' }, areaStyle: { color: '#3265f5', opacity: 0.18 } }] }, true)
}
onMounted(() => { render(); observer = new ResizeObserver(() => chart?.resize()); if (element.value) observer.observe(element.value) })
watch(() => props.items, () => nextTick(render), { deep: true })
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose() })
</script>
<template><div ref="element" class="paper-radar" role="img" aria-label="本卷已考查能力雷达图，具体分数见旁边的能力表格"></div></template>
<style scoped>.paper-radar{height:340px;width:100%;min-width:0}</style>
