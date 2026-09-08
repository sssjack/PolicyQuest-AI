<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { annotationLabels, annotationScore, type Annotation } from '../types/grading'

const props = defineProps<{ answer: string; annotations: Annotation[]; activeId: string; dimensionNames: Record<string, string>; focusedAnchor?: { startOffset: number; endOffset: number; quote: string } | null }>()
const emit = defineEmits<{ select: [id: string]; rubric: [id: string]; material: [id: string] }>()
const detail = ref<HTMLElement | null>(null)
const onlyProblems = ref(false)
function setDetail(element: unknown) { detail.value = element as HTMLElement | null }
const valid = computed(() => props.annotations.filter(a => Number.isInteger(a.startOffset) && Number.isInteger(a.endOffset)
  && a.startOffset >= 0 && a.endOffset > a.startOffset && a.endOffset <= props.answer.length
  && props.answer.slice(a.startOffset, a.endOffset) === a.quote))
const visible = computed(() => valid.value.filter(a => !onlyProblems.value || a.isIssue || a.id === props.activeId))
const active = computed(() => valid.value.find(a => a.id === props.activeId))
const sourceFocus = computed(() => {
  const anchor = props.focusedAnchor
  return anchor && anchor.startOffset >= 0 && anchor.endOffset > anchor.startOffset && props.answer.slice(anchor.startOffset, anchor.endOffset) === anchor.quote ? anchor : null
})
const segments = computed(() => {
  const boundaries = [...new Set([0, props.answer.length, ...visible.value.flatMap(a => [a.startOffset, a.endOffset]), ...(sourceFocus.value ? [sourceFocus.value.startOffset, sourceFocus.value.endOffset] : [])])].sort((a, b) => a - b)
  return boundaries.slice(0, -1).map((start, index) => {
    const end = boundaries[index + 1]!
    return { start, text: props.answer.slice(start, end), focused: !!sourceFocus.value && start >= sourceFocus.value.startOffset && end <= sourceFocus.value.endOffset,
      covering: visible.value.filter(a => a.startOffset <= start && a.endOffset >= end),
      ending: visible.value.filter(a => a.endOffset === end) }
  })
})
watch(() => props.activeId, async id => { if (id) { await nextTick(); detail.value?.focus({ preventScroll: true }) } })
</script>

<template>
  <div class="annotated-answer">
    <div class="paper-toolbar"><span>我的作答 <small>{{ valid.length }} 处精选批注</small></span><label><input v-model="onlyProblems" type="checkbox" /> 只看需改进</label></div>
    <div class="annotation-legend"><span class="problem-dot">需改进</span><span class="hit-dot">命中要点</span><span>点击划线文字或注号，查看老师评语</span></div>
    <div class="review-layout">
      <div class="answer-paper" aria-label="学生原始答案">
        <div v-if="answer" class="original-text"><template v-for="segment in segments" :key="segment.start"><mark v-if="segment.covering.length" :data-evidence-id="segment.focused ? 'point-source' : undefined" :class="{ positive: segment.covering.every(a => !a.isIssue), selected: segment.focused || segment.covering.some(a => a.id === activeId) }" role="button" tabindex="0" :aria-label="`查看批注：${segment.covering.map(a => a.title).join('；')}`" @click="emit('select', segment.covering[0]!.id)" @keydown.enter="emit('select', segment.covering[0]!.id)" @keydown.space.prevent="emit('select', segment.covering[0]!.id)">{{ segment.text }}</mark><span v-else-if="segment.focused" data-evidence-id="point-source" class="source-focus">{{ segment.text }}</span><template v-else>{{ segment.text }}</template><button v-for="a in segment.ending" :key="a.id" :data-evidence-id="a.id" type="button" class="note-badge" :class="{ positive: !a.isIssue, selected: activeId === a.id }" :aria-pressed="activeId === a.id" :aria-label="`注${valid.indexOf(a) + 1}，${annotationScore(a)}，${a.title}`" @click="emit('select', a.id)">注{{ valid.indexOf(a) + 1 }} <span>{{ annotationScore(a) }}</span></button><aside v-if="active && segment.ending.some(a => a.id === activeId)" :ref="setDetail" class="teacher-comment" tabindex="-1" aria-label="老师详细评语" aria-live="polite">
        <template v-if="active">
          <header><span class="comment-label">老师评语 · 注{{ valid.indexOf(active) + 1 }}</span><button type="button" class="close" aria-label="关闭评语" @click="emit('select', '')">×</button></header>
          <span class="comment-type">{{ annotationLabels[active.errorType] }} <b>{{ annotationScore(active) }}</b></span>
          <h3>{{ active.title }}</h3><blockquote>{{ active.quote }}</blockquote><p>{{ active.comment }}</p>
          <div v-if="active.suggestion" class="suggestion"><b>可以这样改</b><p>{{ active.suggestion }}</p></div>
          <p v-if="active.explanation">{{ active.explanation }}</p>
          <small v-if="active.scoreImpact">对应评分点得 {{ active.scoreImpact.earned }}/{{ active.scoreImpact.maxScore }} 分，失 {{ active.scoreImpact.lost }} 分。已计入总分。</small>
          <p v-if="active.dimensionId" class="dimension">关联维度：{{ dimensionNames[active.dimensionId] || active.dimensionId }}</p>
          <button v-if="active.rubricPointId" type="button" class="link" @click="emit('rubric', active.rubricPointId)">查看评分点 {{ active.rubricPointId }} →</button>
          <template v-if="active.evidence"><h4>材料依据 · {{ active.evidence.materialTitle }}</h4><blockquote>{{ active.evidence.quote }}</blockquote><button type="button" class="link" @click="emit('material', active.evidence.materialId)">定位原材料 →</button></template>
        </template>

      </aside></template></div>
        <p v-else class="empty">这份历史记录未保存完整原文，请查看老师补充与答案拆解。</p>
        <p v-if="answer && !valid.length" class="empty">本次没有可准确定位的原文批注，请继续查看老师补充。</p>
      </div>

    </div>
  </div>
</template>

<style scoped>.source-focus{background:#e5efff;box-shadow:0 2px #6288b6}
.annotated-answer{margin-top:22px}.paper-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;font-weight:600}.paper-toolbar small{font-size:12px;color:#778293;margin-left:12px;font-weight:400}.paper-toolbar label{font-size:12px;font-weight:400}.annotation-legend{display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:#7b8190;margin:12px 0 20px}.problem-dot:before,.hit-dot:before{content:'';display:inline-block;width:7px;height:7px;background:#bf5c58;border-radius:50%;margin-right:6px}.hit-dot:before{background:#418673}.review-layout{display:block}.answer-paper{min-width:0;background:#fffdf9;border:1px solid #eee7df;border-radius:10px;padding:28px}.original-text{white-space:pre-wrap;overflow-wrap:anywhere;font-family:'Noto Serif SC','SimSun',serif;font-size:17px;line-height:2.7;color:#303335;tab-size:4}mark{color:inherit;background:#fbebea;border-bottom:1px solid #bd6a63;padding:2px 0;cursor:pointer;box-decoration-break:clone;-webkit-box-decoration-break:clone}mark.positive{background:#edf6ef;border-color:#5f937b}mark.selected{background:#f6d5d1;border-bottom:2px solid #ab423b}.note-badge{display:inline;font-family:inherit;line-height:1.6;font-size:11px;font-weight:600;vertical-align:super;margin:0 3px;padding:2px 5px;border:0;border-radius:4px;background:#b85e58;color:white;white-space:nowrap;cursor:pointer}.note-badge.positive{background:#44846d}.note-badge.selected{outline:2px solid #783b34;outline-offset:2px}.teacher-comment{display:block;position:relative;margin:16px 0 22px;padding:20px;background:#fafbfe;border:1px solid #dfb8b1;border-radius:10px;font-family:Arial,"Microsoft YaHei",sans-serif;font-size:14px;line-height:1.9;white-space:normal;color:#20304a;min-width:0;scroll-margin-top:90px}.teacher-comment:before{content:"";position:absolute;top:-7px;left:22px;width:12px;height:12px;background:#fafbfe;border-top:1px solid #dfb8b1;border-left:1px solid #dfb8b1;transform:rotate(45deg)}.teacher-comment header{display:flex;justify-content:space-between;align-items:center}.comment-label{font-size:12px;color:#8b514c;letter-spacing:.04em}.close{background:none;border:0;font-size:23px;color:#647083;cursor:pointer}.comment-type{font-size:12px;color:#98544e}.comment-type b{margin-left:10px}h3{font-size:16px;margin:12px 0}h4{font-size:13px}blockquote{margin:12px 0;padding:9px 12px;border-left:2px solid #c9948b;background:#fff;white-space:pre-wrap;font-size:13px}p{margin:10px 0;white-space:pre-wrap}small,.dimension{font-size:12px;color:#647083}.suggestion{background:#edf3fc;padding:12px;border-radius:6px}.suggestion b{font-size:12px;color:#35629b}.link{font:inherit;font-size:13px;color:#285d9f;border:0;background:none;padding:0;cursor:pointer}.empty{font-size:13px;color:#727a86}button:focus-visible,mark:focus-visible{outline:3px solid #2863d9;outline-offset:3px}
@media(max-width:1000px){.answer-paper{padding:22px}}
@media(max-width:600px){.answer-paper{padding:16px}.original-text{font-size:16px;line-height:2.8}.paper-toolbar{align-items:flex-start}.paper-toolbar small{display:block;margin:0}.note-badge span{display:none}.annotation-legend{gap:10px}.teacher-comment{padding:14px;margin:14px 0 18px}}
@media print{.review-layout{display:block}.teacher-comment{break-inside:avoid}.note-badge{color:#944f49;background:transparent}.close,.paper-toolbar label{display:none}}
</style>
