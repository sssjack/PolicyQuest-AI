<script setup lang="ts">
import { ref } from 'vue'
import { adminApi } from '../../api'
import { ElMessage } from 'element-plus'

const config = ref({
  article_id: null as number | null,
  question_types: ['politics_single'],
  count: 3,
  difficulty: 'medium',
})
const loading = ref(false)
const result = ref<any>(null)

const typeOptions = [
  { value: 'verbal_main_idea', label: '言语·主旨概括' },
  { value: 'verbal_intent', label: '言语·意图判断' },
  { value: 'verbal_detail', label: '言语·细节理解' },
  { value: 'verbal_fill', label: '言语·逻辑填空' },
  { value: 'politics_single', label: '政治·单选题' },
  { value: 'politics_multi', label: '政治·多选题' },
  { value: 'politics_judge', label: '政治·判断题' },
  { value: 'politics_current', label: '政治·时政热点' },
  { value: 'politics_policy', label: '政治·政策理解' },
  { value: 'interview_analysis', label: '面试·综合分析' },
  { value: 'interview_emergency', label: '面试·应急应变' },
  { value: 'interview_policy', label: '面试·政策落实' },
  { value: 'interview_grassroots', label: '面试·基层治理' },
]

async function generate() {
  loading.value = true; result.value = null
  try {
    const res: any = await adminApi.aiGenerate(config.value)
    result.value = res
    ElMessage.success(res.message || '生成成功')
  } catch (e: any) { ElMessage.error(e.message || 'AI出题失败') }
  finally { loading.value = false }
}
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">AI 智能出题</h1>

    <div class="gen-layout">
      <div class="gen-config glass-card">
        <h3 style="margin-bottom:20px">出题配置</h3>
        <el-form label-position="top">
          <el-form-item label="题型选择">
            <el-select v-model="config.question_types" multiple placeholder="选择题型" style="width:100%">
              <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="生成数量">
            <el-slider v-model="config.count" :min="1" :max="10" show-stops :marks="{ 1: '1', 3: '3', 5: '5', 10: '10' }" />
          </el-form-item>
          <el-form-item label="难度">
            <el-radio-group v-model="config.difficulty">
              <el-radio-button value="easy">简单</el-radio-button>
              <el-radio-button value="medium">中等</el-radio-button>
              <el-radio-button value="hard">困难</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="关联文章ID（可选）">
            <el-input-number v-model="config.article_id" :min="0" placeholder="留空则生成通用题目" style="width:100%" />
          </el-form-item>
        </el-form>
        <el-button type="primary" :loading="loading" @click="generate" style="width:100%;margin-top:12px">
          {{ loading ? 'AI 正在生成中...' : '开始生成' }}
        </el-button>
        <p v-if="loading" style="text-align:center;margin-top:12px;font-size:13px;color:var(--text-muted)">
          AI 正在思考，预计需要 10-30 秒...
        </p>
      </div>

      <div class="gen-result">
        <div v-if="!result && !loading" class="empty-state glass-card">
          <div style="font-size:48px;margin-bottom:16px">🤖</div>
          <p style="color:var(--text-muted)">配置参数后点击"开始生成"，AI 将自动创建题目</p>
          <p style="color:var(--text-muted);font-size:13px;margin-top:8px">生成的题目状态为"待审核"，需要管理员审核后才能上线</p>
        </div>
        <div v-if="result" class="result-list">
          <div class="result-header glass-card" style="margin-bottom:16px;padding:16px">
            <span style="font-weight:600">{{ result.message }}</span>
          </div>
          <div v-for="q in result.data?.questions" :key="q.id" class="result-card glass-card">
            <div style="display:flex;gap:8px;margin-bottom:8px">
              <el-tag size="small">{{ q.question_type }}</el-tag>
              <el-tag size="small" :type="q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'">{{ q.difficulty }}</el-tag>
              <el-tag size="small" type="warning">待审核</el-tag>
            </div>
            <div style="font-size:14px;line-height:1.7;margin-bottom:12px;white-space:pre-wrap">{{ q.stem }}</div>
            <div v-if="q.options" style="font-size:13px;color:var(--text-secondary)">
              <div v-for="(text, key) in q.options" :key="key" style="margin-bottom:4px">
                <strong>{{ key }}.</strong> {{ text }}
              </div>
            </div>
            <div style="margin-top:8px;font-size:13px;color:var(--success)">答案：{{ q.answer }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gen-layout { display: flex; gap: 24px; }
.gen-config { width: 360px; flex-shrink: 0; padding: 24px; align-self: flex-start; position: sticky; top: 24px; }
.gen-result { flex: 1; }
.empty-state { text-align: center; padding: 60px 24px; }
.result-list { display: flex; flex-direction: column; gap: 12px; }
.result-card { padding: 20px; }
</style>
