<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { ScoreDimension } from '../data/policyQuest'

const props = withDefaults(
  defineProps<{
    items: ScoreDimension[]
    benchmark?: number
    height?: number
  }>(),
  {
    benchmark: 72,
    height: 260,
  },
)

const chartRef = ref<HTMLDivElement | null>(null)
let chart: ReturnType<typeof echarts.init> | null = null

function renderChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  const names = props.items.map(item => item.name)
  const values = props.items.map(item => item.score)
  const benchmarkValues = names.map(() => props.benchmark)

  chart.setOption({
    color: ['#0b66ff', '#00b8d9'],
    tooltip: { trigger: 'item' },
    radar: {
      indicator: names.map(name => ({ name, max: 100 })),
      radius: '66%',
      splitNumber: 4,
      axisName: {
        color: '#24324a',
        fontSize: 12,
        fontWeight: 700,
      },
      splitLine: { lineStyle: { color: '#d9e5f7' } },
      splitArea: {
        areaStyle: {
          color: ['rgba(11, 102, 255, 0.04)', 'rgba(0, 184, 217, 0.04)'],
        },
      },
      axisLine: { lineStyle: { color: '#d9e5f7' } },
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 5,
        areaStyle: { opacity: 0.18 },
        lineStyle: { width: 3 },
        data: [
          { value: values, name: '我的得分' },
          {
            value: benchmarkValues,
            name: '平均水平',
            areaStyle: { opacity: 0.06 },
            lineStyle: { width: 2, type: 'dashed' },
            symbolSize: 4,
          },
        ],
      },
    ],
  })
}

function resizeChart() {
  chart?.resize()
}

onMounted(async () => {
  await nextTick()
  renderChart()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
  chart = null
})

watch(
  () => props.items.map(item => `${item.name}:${item.score}`).join('|'),
  () => {
    nextTick(renderChart)
  },
)
</script>

<template>
  <div ref="chartRef" class="ability-radar" :style="{ height: `${height}px` }"></div>
</template>

<style scoped>
.ability-radar {
  width: 100%;
  min-height: 220px;
}
</style>
