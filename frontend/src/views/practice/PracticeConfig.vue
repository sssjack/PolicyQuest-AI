<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { practiceApi } from '../../api'

const router = useRouter()
const loading = ref(false)
const config = ref({
  session_type: 'quick',
  count: 10,
  category: '',
  difficulty: '',
  exam_type: '',
  verbal_subtype: '',
})

const sessionTypes = [
  { value: 'quick', label: '快速练习', desc: '随机抽题，保持手感', tag: 'Daily' },
  { value: 'special', label: '专项练习', desc: '围绕题型集中突破', tag: 'Focus' },
  { value: 'mock', label: '模拟考试', desc: '还原限时考场节奏', tag: 'Mock' },
]
const categories = [
  { value: '', label: '全部题型' },
  { value: 'verbal', label: '言语理解' },
  { value: 'politics', label: '政治理论' },
  { value: 'interview', label: '面试' },
]
const verbalSubtypes = [
  { value: '', label: '全部言语' },
  { value: 'logic_fill', label: '逻辑填空' },
  { value: 'passage_read', label: '片段阅读' },
  { value: 'sentence_exp', label: '语句表达' },
]
const difficulties = [
  { value: '', label: '全部难度' },
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
]
const examTypes = [
  { value: '', label: '全部考试' },
  { value: 'national', label: '国考' },
  { value: 'provincial', label: '省考' },
  { value: 'institution', label: '事业编' },
  { value: 'tax', label: '税务' },
  { value: 'selection', label: '选调生' },
]

const selectedSessionLabel = computed(() => sessionTypes.find(item => item.value === config.value.session_type)?.label || '快速练习')

function onCategoryChange(val: string) {
  config.value.category = val
  if (val !== 'verbal') config.value.verbal_subtype = ''
}

async function startPractice() {
  loading.value = true
  try {
    const res: any = await practiceApi.start(config.value)
    router.push(`/app/practice/${res.data.session_id}`)
  } catch (e: any) {
    ElMessage.error(e.message || '开始练习失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="practice-config page-container">
    <section class="config-hero">
      <div>
        <p class="page-kicker">Practice Setup</p>
        <h1 class="page-title">配置一组刚刚好的训练</h1>
        <p class="page-subtitle">选择训练模式、题量、题型与考试方向，系统会生成适合当前阶段的练习会话。</p>
      </div>
      <button class="btn-primary" type="button" :disabled="loading" @click="startPractice">
        {{ loading ? '正在组卷...' : '开始练习' }}
      </button>
    </section>

    <section class="type-grid">
      <button
        v-for="item in sessionTypes"
        :key="item.value"
        type="button"
        class="type-card"
        :class="{ active: config.session_type === item.value }"
        @click="config.session_type = item.value"
      >
        <span class="type-tag">{{ item.tag }}</span>
        <strong>{{ item.label }}</strong>
        <small>{{ item.desc }}</small>
      </button>
    </section>

    <section class="config-panel glass-card">
      <div class="panel-title">
        <p class="page-kicker">Options</p>
        <h2>训练参数</h2>
      </div>

      <div class="config-grid">
        <div class="config-item count-item">
          <label>题目数量</label>
          <div class="count-selector">
            <button
              v-for="count in [5, 10, 20, 30, 50]"
              :key="count"
              type="button"
              class="count-btn"
              :class="{ active: config.count === count }"
              @click="config.count = count"
            >
              {{ count }}
            </button>
          </div>
        </div>

        <div class="config-item">
          <label>题目类型</label>
          <div class="option-group">
            <button v-for="item in categories" :key="item.value" type="button" class="opt-btn" :class="{ active: config.category === item.value }" @click="onCategoryChange(item.value)">
              {{ item.label }}
            </button>
          </div>
        </div>

        <div v-if="config.category === 'verbal'" class="config-item">
          <label>言语题型</label>
          <div class="option-group">
            <button v-for="item in verbalSubtypes" :key="item.value" type="button" class="opt-btn" :class="{ active: config.verbal_subtype === item.value }" @click="config.verbal_subtype = item.value">
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="config-item">
          <label>难度</label>
          <div class="option-group">
            <button v-for="item in difficulties" :key="item.value" type="button" class="opt-btn" :class="{ active: config.difficulty === item.value }" @click="config.difficulty = item.value">
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="config-item">
          <label>考试方向</label>
          <div class="option-group">
            <button v-for="item in examTypes" :key="item.value" type="button" class="opt-btn" :class="{ active: config.exam_type === item.value }" @click="config.exam_type = item.value">
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="preview-card glass-card">
      <div>
        <p class="page-kicker">Session Preview</p>
        <h2>{{ config.count }} 题 · {{ selectedSessionLabel }}</h2>
        <p>建议在安静环境下完成，提交后可查看正确率、解析与学习记录。</p>
      </div>
      <button class="btn-primary" type="button" :disabled="loading" @click="startPractice">
        {{ loading ? '正在组卷...' : '确认开始' }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.practice-config {
  display: grid;
  gap: 22px;
}

.config-hero,
.preview-card {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 26px;
  border: 1px solid rgba(194, 198, 216, 0.72);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.type-card {
  display: grid;
  gap: 10px;
  min-height: 168px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #ffffff;
  color: var(--text-primary);
  text-align: left;
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.type-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 80, 203, 0.36);
}

.type-card.active {
  border-color: var(--primary);
  background: var(--surface-muted);
}

.type-tag {
  justify-self: start;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--secondary-soft);
  color: var(--secondary);
  font-size: 11px;
  font-weight: 900;
}

.type-card strong {
  font-size: 20px;
}

.type-card small {
  color: var(--text-secondary);
  line-height: 1.55;
}

.config-panel {
  padding: 28px;
}

.panel-title h2 {
  margin: 0 0 22px;
  font-size: 24px;
}

.config-grid {
  display: grid;
  gap: 24px;
}

.config-item {
  display: grid;
  gap: 12px;
}

.config-item label {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 900;
}

.count-selector,
.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.count-btn,
.opt-btn {
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.count-btn {
  min-width: 58px;
}

.opt-btn {
  padding: 0 16px;
}

.count-btn:hover,
.opt-btn:hover {
  border-color: rgba(0, 80, 203, 0.35);
}

.count-btn.active,
.opt-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #ffffff;
}

.preview-card {
  align-items: center;
}

.preview-card h2 {
  margin: 0;
  font-size: 24px;
}

.preview-card p:last-child {
  margin: 8px 0 0;
  color: var(--text-secondary);
}

@media (max-width: 1040px) {
  .type-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .config-hero,
  .preview-card {
    display: grid;
  }

  .config-hero button,
  .preview-card button {
    width: 100%;
  }

  .type-grid {
    grid-template-columns: 1fr;
  }
}
</style>
