<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { handwritingApi } from '../api'

const props = defineProps<{ modelValue: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const visible = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const preview = ref('')
const recognizing = ref(false)
const text = ref('')
const originalText = ref('')
const lowConfidence = ref(0)
const errorMessage = ref('')
let controller: AbortController | null = null
const jobId = ref('')
const queueStatus = ref<{ status: string; waitingAhead: number; runningAhead: number; estimatedWaitSeconds: number } | null>(null)
const progressMessage = computed(() => {
  const job = queueStatus.value
  if (!job) return '正在上传照片…'
  if (job.status === 'running') return '已轮到你，正在识别照片，请稍候…'
  const minutes = Math.max(0.1, Math.ceil(job.estimatedWaitSeconds / 6) / 10)
  return `服务忙，前面还有 ${job.waitingAhead} 人等待 OCR 识别${job.runningAhead ? '，另有 1 人正在识别' : ''}。预计等待约 ${minutes} 分钟，轮到你后将自动识别。`
})
const paragraphs = computed(() => text.value.split(/\n\s*\n/).filter(item => item.trim()))

function pause(signal: AbortSignal) {
  return new Promise<void>(resolve => {
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve() }
    const timer = setTimeout(finish, 2000)
    signal.addEventListener('abort', finish, { once: true })
    if (signal.aborted) finish()
  })
}
function cancelRecognition() {
  controller?.abort()
  if (jobId.value) void handwritingApi.cancel(jobId.value).catch(() => {})
}

function releasePreview() { if (preview.value) URL.revokeObjectURL(preview.value); preview.value = '' }
function open() { visible.value = true }
async function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0]
  input.value = ''
  if (!selected) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) return ElMessage.warning('支持 JPG、PNG 和 WebP 图片')
  if (selected.size > 8 * 1024 * 1024) return ElMessage.warning('图片请控制在8MB以内')
  if (text.value.trim()) {
    try { await ElMessageBox.confirm('更换照片会清空当前识别草稿，已填入的答案会保留。', '更换照片') }
    catch { return }
  }
  releasePreview()
  file.value = selected
  preview.value = URL.createObjectURL(selected)
  text.value = ''; originalText.value = ''; errorMessage.value = ''; lowConfidence.value = 0
}
async function recognize() {
  if (!file.value || recognizing.value) return
  recognizing.value = true; errorMessage.value = ''; queueStatus.value = null
  const current = new AbortController()
  controller = current
  try {
    // 上传完成后即使窗口已关闭，也取回任务ID并取消，防止遗留队列位置。
    const response: any = await handwritingApi.recognize(file.value)
    jobId.value = response.data.id
    let job = response.data
    let pollFailures = 0
    while (!current.signal.aborted) {
      queueStatus.value = job
      if (job.status === 'completed') {
        text.value = job.result.text
        originalText.value = job.result.text
        lowConfidence.value = job.result.lines.filter((line: any) => line.confidence < 0.85).length
        return
      }
      if (job.status === 'failed' || job.status === 'cancelled') throw new Error(job.message || '识别已取消，可重新识别')
      await pause(current.signal)
      if (current.signal.aborted) break
      try {
        const status: any = await handwritingApi.status(jobId.value, current.signal)
        job = status.data
        pollFailures = 0
      } catch (error: any) {
        if (current.signal.aborted) break
        if ([401, 404].includes(error?.code) || ++pollFailures >= 3) throw error
      }
    }
  } catch (error: any) {
    if (!current.signal.aborted) errorMessage.value = error?.message || '识别失败，请重试或更换照片'
  } finally {
    if (jobId.value) void handwritingApi.cancel(jobId.value).catch(() => {})
    jobId.value = ''; queueStatus.value = null; recognizing.value = false
  }
}
async function apply(mode: 'append' | 'replace') {
  if (!text.value.trim()) return
  if (mode === 'replace' && props.modelValue.trim()) {
    try { await ElMessageBox.confirm('确认用校对后的文字替换本题现有答案？', '替换答案') }
    catch { return }
  }
  emit('update:modelValue', mode === 'append' && props.modelValue.trim()
    ? `${props.modelValue.trimEnd()}\n\n${text.value.trim()}` : text.value.trim())
  visible.value = false
  text.value = ''; originalText.value = ''; file.value = null; releasePreview()
  ElMessage.success('文字已填入本题答案，可继续编辑')
}
function moveParagraph(index: number, offset: number) {
  const items = [...paragraphs.value]
  const target = index + offset
  if (target < 0 || target >= items.length) return
  const item = items.splice(index, 1)[0]!
  items.splice(target, 0, item)
  text.value = items.join('\n\n')
}
watch(visible, value => { if (!value) cancelRecognition() })
onBeforeUnmount(() => { cancelRecognition(); releasePreview() })
</script>

<template>
  <div class="handwriting-action">
    <el-button :icon="UploadFilled" :disabled="disabled" @click="open">手写上传</el-button>
    <span>拍照识别后校对文字，支持调整段落</span>
    <el-dialog v-model="visible" title="手写答案识别" width="960px" class="handwriting-dialog" :close-on-click-modal="false" append-to-body>
      <p class="ocr-intro">上传本题手写答案，识别后请先校对。支持 JPG、PNG、WebP，单张不超过 8MB。识别不消耗积分。</p>
      <div class="ocr-layout">
        <section class="ocr-photo">
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="chooseFile">
          <img v-if="preview" :src="preview" alt="待识别的手写答案照片">
          <div v-else class="ocr-placeholder"><el-icon :size="42"><UploadFilled /></el-icon><b>上传清晰的手写答卷照片</b><span>尽量拍正，避免阴影、反光和裁切文字</span></div>
          <div class="ocr-buttons"><el-button :disabled="recognizing" @click="fileInput?.click()">{{ file ? '更换照片' : '选择照片' }}</el-button><el-button type="primary" :disabled="!file" :loading="recognizing" @click="recognize">{{ recognizing ? (queueStatus?.status === 'queued' ? '排队中…' : queueStatus ? '正在识别…' : '上传中…') : '识别文字' }}</el-button><el-button v-if="recognizing" @click="cancelRecognition">{{ queueStatus?.status === 'queued' ? '取消排队' : '取消' }}</el-button></div>
          <small v-if="file">{{ file.name }}</small>
        </section>
        <section class="ocr-editor">
          <label for="handwriting-result">识别结果 · 可直接编辑</label>
          <div v-if="recognizing" role="status" aria-live="polite"><el-alert :title="progressMessage" type="info" :closable="false" show-icon /><small>等待时间为动态估算，可能随图片复杂度变化。关闭窗口会取消等待。</small></div>
          <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />
          <el-alert v-if="lowConfidence" :title="`${lowConfidence} 行识别置信度较低，请对照照片仔细校对`" type="warning" :closable="false" />
          <textarea id="handwriting-result" v-model="text" :disabled="recognizing" placeholder="识别结果会显示在这里。可以改字、换行，空一行划分段落。" />
          <div class="ocr-buttons"><el-button size="small" :disabled="!text || recognizing" @click="text = text.split(/\n\s*\n/).map(part => part.replace(/\n/g, '')).join('\n\n')">合并行内换行</el-button><el-button size="small" :disabled="!text || recognizing" @click="text = text.replace(/\n+/g, '\n\n')">按行分段</el-button><el-button size="small" :disabled="!originalText || recognizing" @click="text = originalText">恢复识别原文</el-button></div>
          <small>{{ text.replace(/\s/g, '').length }} 字 · 空行分段，可在下方调整顺序</small>
          <div v-if="paragraphs.length > 1" class="ocr-paragraphs"><div v-for="(item, index) in paragraphs" :key="index"><span>{{ index + 1 }}. {{ item }}</span><el-button size="small" :disabled="index === 0 || recognizing" :aria-label="`第${index + 1}段上移`" @click="moveParagraph(index, -1)">上移</el-button><el-button size="small" :disabled="index === paragraphs.length - 1 || recognizing" :aria-label="`第${index + 1}段下移`" @click="moveParagraph(index, 1)">下移</el-button></div></div>
        </section>
      </div>
      <template #footer><el-button @click="visible = false">暂存并关闭</el-button><el-button :disabled="!text.trim() || recognizing" @click="apply('replace')">替换本题答案</el-button><el-button type="primary" :disabled="!text.trim() || recognizing" @click="apply('append')">{{ modelValue.trim() ? '追加到本题答案' : '填入本题答案' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.handwriting-action{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:12px 0}.handwriting-action>span{font-size:12px;color:#728198}.ocr-intro{margin:0 0 18px;color:#68768b;line-height:1.7}.ocr-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:22px}.ocr-photo,.ocr-editor{min-width:0}.ocr-photo>img{width:100%;height:350px;object-fit:contain;background:#f3f6fa;border-radius:12px}.ocr-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;height:350px;border:1px dashed #bfccde;border-radius:12px;background:#f7f9fc;color:#6b819d}.ocr-placeholder span{font-size:12px}.ocr-buttons{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.ocr-buttons .el-button+.el-button{margin:0}.ocr-editor{display:flex;flex-direction:column;gap:10px}.ocr-editor label{font-weight:700;color:#213047}.ocr-editor textarea{width:100%;min-height:285px;resize:vertical;border:1px solid #cbd5e3;border-radius:10px;padding:14px;font-family:inherit;font-size:15px;line-height:1.85;color:#26364c;background:#fff;box-sizing:border-box}.ocr-editor textarea:focus{outline:2px solid #7da7f7;outline-offset:2px}.ocr-photo small,.ocr-editor small{color:#8290a3;overflow-wrap:anywhere}.ocr-paragraphs{max-height:170px;overflow:auto}.ocr-paragraphs>div{display:flex;gap:6px;align-items:center;border-bottom:1px solid #edf0f4;padding:8px 0}.ocr-paragraphs span{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:12px}.ocr-paragraphs .el-button+.el-button{margin:0}@media(max-width:700px){.ocr-layout{grid-template-columns:1fr}.ocr-photo>img,.ocr-placeholder{height:220px}.ocr-editor textarea{min-height:220px}}
</style>
<style>.handwriting-dialog{max-width:calc(100vw - 24px)}@media(max-width:700px){.handwriting-dialog .el-dialog__footer{display:flex;flex-wrap:wrap;gap:8px}.handwriting-dialog .el-dialog__footer .el-button{margin:0}}</style>
