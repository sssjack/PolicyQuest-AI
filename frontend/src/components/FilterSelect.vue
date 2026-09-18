<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowDown, Search } from '@element-plus/icons-vue'

interface FilterOption {
  value: string
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  label: string
  options: FilterOption[]
  placeholder?: string
  columns?: number
  panelWidth?: number
  searchThreshold?: number
}>(), {
  placeholder: '全部',
  columns: 3,
  panelWidth: 0,
  searchThreshold: 12,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const open = ref(false)
const alignRight = ref(false)
const query = ref('')

const searchable = computed(() => props.options.length > props.searchThreshold)

const visibleOptions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(item => item.label.toLowerCase().includes(q))
})

// 面板默认从按钮左侧向右展开；按钮位于屏幕右半边时改为右对齐，避免溢出视口。
function measureAlign() {
  const el = trigger.value
  if (!el || typeof window === 'undefined') return
  const rect = el.getBoundingClientRect()
  alignRight.value = rect.left + rect.width / 2 > window.innerWidth / 2
}

function toggle() {
  if (!open.value) {
    measureAlign()
    query.value = ''
  }
  open.value = !open.value
  if (open.value && searchable.value) {
    nextTick(() => searchInput.value?.focus())
  }
}

const activeLabel = computed(() => {
  const hit = props.options.find(item => item.value === props.modelValue)
  return hit ? hit.label : (props.placeholder || '全部')
})
const isActive = computed(() => props.modelValue !== 'all')

const panelStyle = computed(() => {
  const style: Record<string, string> = {
    '--fs-cols': String(Math.max(1, props.columns)),
  }
  if (props.panelWidth) style.width = `${props.panelWidth}px`
  return style
})

function choose(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function onDocumentPointerDown(event: MouseEvent) {
  if (!open.value) return
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) open.value = false
}

function onResize() {
  if (open.value) measureAlign()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentPointerDown)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentPointerDown)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div ref="root" class="filter-select" :class="{ open, active: isActive, 'align-right': alignRight }">
    <span class="fs-label">{{ label }}</span>
    <button
      ref="trigger"
      type="button"
      class="fs-trigger"
      :aria-expanded="open"
      :aria-label="`${label}：${activeLabel}`"
      @click="toggle"
    >
      <span class="fs-value">{{ activeLabel }}</span>
      <el-icon class="fs-caret"><ArrowDown /></el-icon>
    </button>

    <transition name="fs-fade">
      <div v-if="open" class="fs-panel" role="listbox" :style="panelStyle">
        <div v-if="searchable" class="fs-search">
          <el-icon class="fs-search-icon"><Search /></el-icon>
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            class="fs-search-input"
            placeholder="输入关键词筛选"
            aria-label="筛选选项"
            @keydown.stop
          />
        </div>
        <button
          v-for="item in visibleOptions"
          :key="item.value"
          type="button"
          role="option"
          class="fs-option"
          :class="{ selected: item.value === modelValue }"
          :aria-selected="item.value === modelValue"
          @click="choose(item.value)"
        >
          {{ item.label }}
        </button>
        <p v-if="!visibleOptions.length" class="fs-empty">没有匹配项</p>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.filter-select {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fs-label {
  color: #8b96a7;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.fs-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 132px;
  min-height: 38px;
  padding: 0 12px 0 14px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #fbfcff;
  color: #2b3a52;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
}

.fs-trigger:hover {
  border-color: #b9c8de;
  background: #ffffff;
}

.filter-select.active .fs-trigger {
  border-color: #9dbcfa;
  background: #f3f7ff;
  color: #2a62d8;
}

.filter-select.open .fs-trigger {
  border-color: #397bf6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(57, 123, 246, 0.14);
}

.fs-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-caret {
  flex: none;
  color: #93a1b8;
  font-size: 13px;
  transition: transform .18s ease, color .16s ease;
}

.filter-select.open .fs-caret {
  color: #397bf6;
  transform: rotate(180deg);
}

.fs-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 60;
  display: grid;
  grid-template-columns: repeat(var(--fs-cols, 3), minmax(0, 1fr));
  gap: 4px;
  width: max-content;
  max-width: min(680px, calc(100vw - 48px));
  max-height: 360px;
  padding: 10px;
  overflow-x: hidden;
  overflow-y: auto;
  border: 1px solid #e3eaf5;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 18px 42px rgba(28, 58, 108, 0.16);
}

.filter-select.align-right .fs-panel {
  left: auto;
  right: 0;
}

.fs-search {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  padding: 0 10px;
  min-height: 36px;
  border: 1px solid #dbe3ef;
  border-radius: 9px;
  background: #f8fafd;
}

.fs-search:focus-within {
  border-color: #397bf6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(57, 123, 246, 0.12);
}

.fs-search-icon {
  flex: none;
  color: #9aa7bd;
  font-size: 14px;
}

.fs-search-input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #2b3a52;
  font-size: 14px;
}

.fs-search-input::placeholder {
  color: #a9b4c6;
}

.fs-empty {
  grid-column: 1 / -1;
  margin: 6px 0;
  color: #9aa7bd;
  font-size: 13px;
  text-align: center;
}

.fs-option {
  min-height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #46536a;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: background .14s ease, color .14s ease;
}

.fs-option:hover {
  background: #f1f5fd;
  color: #1f3047;
}

.fs-option.selected {
  background: #e8f0ff;
  color: #2a62d8;
  font-weight: 800;
}

.fs-fade-enter-active,
.fs-fade-leave-active {
  transition: opacity .14s ease;
}

.fs-fade-enter-from,
.fs-fade-leave-to {
  opacity: 0;
}

@media (max-width: 760px) {
  .fs-trigger {
    min-width: 0;
    flex: 1;
  }

  .fs-panel {
    width: max-content;
    max-width: calc(100vw - 32px);
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
