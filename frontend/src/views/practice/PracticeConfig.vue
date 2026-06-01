<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { practiceApi } from '../../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const config = ref({
  session_type: 'quick', count: 10, category: '', difficulty: '', exam_type: '', timed: false, time_limit: 20
})

const sessionTypes = [
  { value: 'quick', label: '快速练习', desc: '随机抽取题目，快速训练', icon: '⚡' },
  { value: 'special', label: '专项练习', desc: '按题型针对性训练', icon: '🎯' },
  { value: 'wrong', label: '错题练习', desc: '攻克薄弱知识点', icon: '📕' },
  { value: 'mock', label: '模拟考试', desc: '还原真实考场体验', icon: '📋' },
]
const categories = [
  { value: '', label: '全部题型' },
  { value: 'verbal', label: '言语理解' },
  { value: 'politics', label: '政治理论' },
  { value: 'interview', label: '面试' },
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

async function startPractice() {
  loading.value = true
  try {
    const res: any = await practiceApi.start(config.value)
    router.push(`/app/practice/${res.data.session_id}`)
  } catch (e: any) { ElMessage.error(e.message || '开始练习失败') }
  finally { loading.value = false }
}
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">练习配置</h1>

    <div class="type-grid">
      <div v-for="t in sessionTypes" :key="t.value" class="type-card glass-card"
        :class="{ active: config.session_type === t.value }" @click="config.session_type = t.value">
        <div class="type-icon">{{ t.icon }}</div>
        <div class="type-label">{{ t.label }}</div>
        <div class="type-desc">{{ t.desc }}</div>
      </div>
    </div>

    <div class="config-section glass-card">
      <div class="config-grid">
        <div class="config-item">
          <label>题目数量</label>
          <div class="count-selector">
            <button v-for="c in [5,10,20,30,50]" :key="c" class="count-btn" :class="{ active: config.count === c }" @click="config.count = c">{{ c }}</button>
          </div>
        </div>
        <div class="config-item">
          <label>题目类型</label>
          <div class="option-group">
            <button v-for="c in categories" :key="c.value" class="opt-btn" :class="{ active: config.category === c.value }" @click="config.category = c.value">{{ c.label }}</button>
          </div>
        </div>
        <div class="config-item">
          <label>难度</label>
          <div class="option-group">
            <button v-for="d in difficulties" :key="d.value" class="opt-btn" :class="{ active: config.difficulty === d.value }" @click="config.difficulty = d.value">{{ d.label }}</button>
          </div>
        </div>
        <div class="config-item">
          <label>考试方向</label>
          <div class="option-group">
            <button v-for="e in examTypes" :key="e.value" class="opt-btn" :class="{ active: config.exam_type === e.value }" @click="config.exam_type = e.value">{{ e.label }}</button>
          </div>
        </div>
        <div class="config-item">
          <label>计时模式</label>
          <div style="display:flex;align-items:center;gap:16px">
            <label class="switch"><input type="checkbox" v-model="config.timed" /><span class="slider" /></label>
            <span v-if="config.timed" style="color:var(--text-secondary);font-size:14px">每题 {{ config.time_limit }} 分钟</span>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top:32px;text-align:center">
      <button class="btn-primary btn-lg" @click="startPractice" :disabled="loading" style="min-width:200px">
        {{ loading ? '正在组卷...' : '开始练习' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
.type-card { text-align: center; cursor: pointer; padding: 24px 16px; }
.type-card.active { border-color: var(--primary); background: rgba(99,102,241,0.1); }
.type-icon { font-size: 32px; margin-bottom: 8px; }
.type-label { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.type-desc { font-size: 12px; color: var(--text-muted); }

.config-section { padding: 32px; }
.config-grid { display: flex; flex-direction: column; gap: 24px; }
.config-item label { display: block; font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; }

.count-selector { display: flex; gap: 8px; }
.count-btn {
  width: 56px; height: 40px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03); color: var(--text-primary); font-size: 15px; cursor: pointer;
  transition: all 0.2s;
}
.count-btn.active { background: rgba(99,102,241,0.2); border-color: var(--primary); color: var(--primary-light); }
.count-btn:hover { border-color: rgba(255,255,255,0.2); }

.option-group { display: flex; gap: 8px; flex-wrap: wrap; }
.opt-btn {
  padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03); color: var(--text-secondary); font-size: 13px; cursor: pointer;
  transition: all 0.2s;
}
.opt-btn.active { background: rgba(99,102,241,0.2); border-color: var(--primary); color: var(--primary-light); }
.opt-btn:hover { border-color: rgba(255,255,255,0.2); }

.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; inset: 0; background: rgba(255,255,255,0.1);
  border-radius: 24px; transition: 0.3s;
}
.slider::before {
  content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px;
  background: #fff; border-radius: 50%; transition: 0.3s;
}
.switch input:checked + .slider { background: var(--primary); }
.switch input:checked + .slider::before { transform: translateX(20px); }

.btn-lg { padding: 16px 40px !important; font-size: 16px !important; }

@media (max-width: 768px) { .type-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
