import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : '/PolicyQuest/api',
  timeout: 70000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('pq_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
    const previewBypass = import.meta.env.DEV && new URLSearchParams(hashQuery).get('preview') === '1'
    if (err.response?.status === 401 && !previewBypass) {
      localStorage.removeItem('pq_token')
      localStorage.removeItem('pq_user')
      window.location.hash = '#/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export default api

export const handwritingApi = {
  recognize: (file: File, signal?: AbortSignal) => {
    const data = new FormData()
    data.append('image', file)
    return api.post('/handwriting/jobs', data, { timeout: 60000, signal })
  },
  status: (id: string, signal?: AbortSignal) => api.get(`/handwriting/jobs/${id}`, { timeout: 15000, signal }),
  cancel: (id: string) => api.delete(`/handwriting/jobs/${id}`, { timeout: 10000 }),
}

// HTTP 页面也可生成重试标识，不依赖仅安全上下文开放的 randomUUID。
export function requestId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), item => item.toString(16).padStart(2, '0')).join('')
}

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile'),
  uploadAvatar: (file: File) => {
    const data = new FormData()
    data.append('avatar', file)
    return api.post('/auth/avatar', data)
  },
  updateProfile: (data: any) => api.put('/auth/profile', data),
}

export const questionApi = {
  list: (params: any) => api.get('/questions', { params }),
  random: (params: any) => api.get('/questions/random', { params }),
  detail: (id: number) => api.get(`/questions/${id}`),
  stats: () => api.get('/questions/stats'),
}

export const realPaperApi = {
  paperReport: (id: string | number) => api.get(`/real-papers/attempts/${id}/paper-report`),
  generatePaperReport: (id: string | number) => api.post(`/real-papers/attempts/${id}/paper-report`),
  paperTarget: (id: string | number, target: number) => api.put(`/real-papers/attempts/${id}/paper-target`, { target }),
  paperProfile: () => api.get('/real-papers/paper-profile'),
  essayProfile: () => api.get('/real-papers/essay-profile'),
  coverage: () => api.get('/real-papers/coverage'),
  regrade: (id: string | number) => api.post(`/real-papers/attempts/${id}/regrade`),
  list: (params: any) => api.get('/real-papers', { params }),
  detail: (id: string | number) => api.get(`/real-papers/${id}`),
  stats: () => api.get('/real-papers/stats'),
  attempts: (params: any = {}) => api.get('/real-papers/attempts', { params }),
  attemptDetail: (id: string | number) => api.get(`/real-papers/attempts/${id}`),
  submitAttempt: (data: any) => api.post('/real-papers/attempts', data),
}

export const practiceApi = {
  start: (data: any) => api.post('/practice/start', data),
  answer: (sessionId: number, data: any) => api.post(`/practice/${sessionId}/answer`, data),
  submit: (sessionId: number) => api.post(`/practice/${sessionId}/submit`),
  history: (params: any) => api.get('/practice/history', { params }),
}

export const statsApi = {
  overview: () => api.get('/stats/overview'),
}

export const wrongbookApi = {
  wrong: (params: any) => api.get('/wrongbook/wrong', { params }),
  markMastered: (id: string | number) => api.put(`/wrongbook/wrong/${id}/master`),
  deleteWrong: (id: string | number) => api.delete(`/wrongbook/wrong/${id}`),
  favorites: (params: any) => api.get('/wrongbook/favorites', { params }),
  toggleFavorite: (questionId: string | number) => api.post(`/wrongbook/favorites/${questionId}`),
}

export const notesApi = {
  list: (params: any = {}) => api.get('/notes', { params }),
  create: (data: any) => api.post('/notes', data),
  update: (id: string | number, data: any) => api.put(`/notes/${id}`, data),
  delete: (id: string | number) => api.delete(`/notes/${id}`),
  batchDelete: (ids: Array<string | number>) => api.post('/notes/batch-delete', { ids }),
}

export const articlesApi = {
  list: (params: any) => api.get('/articles', { params }),
  detail: (id: number) => api.get(`/articles/${id}`),
}

export const scoringApi = {
  evaluate: (data: any) => api.post('/scoring/evaluate', data),
}

export const accountApi = {
  notifications: (params: any = {}) => api.get('/account/notifications', { params }),
  readNotification: (id: number) => api.put(`/account/notifications/${id}/read`),
  readAllNotifications: () => api.put('/account/notifications/read-all'),
  feedbacks: () => api.get('/account/feedbacks'),
  createFeedback: (data: any) => api.post('/account/feedbacks', data),
}

export const adminApi = {
  adjustCredits: (id: number, data: { delta: number; reason: string; requestId: string }) => api.post(`/admin/users/${id}/credits`, data),
  dashboard: () => api.get('/admin/dashboard'),
  users: (params: any) => api.get('/admin/users', { params }),
  userSummary: (id: number) => api.get(`/admin/users/${id}/summary`),
  updateUserStatus: (id: number, status: string) => api.put(`/admin/users/${id}/status`, { status }),
  questions: (params: any) => api.get('/admin/questions', { params }),
  updateQuestion: (id: number, data: any) => api.put(`/admin/questions/${id}`, data),
  createQuestion: (data: any) => api.post('/admin/questions', data),
  deleteQuestion: (id: number) => api.delete(`/admin/questions/${id}`),
  approveQuestion: (id: number) => api.put(`/admin/questions/${id}/approve`),
  rejectQuestion: (id: number) => api.put(`/admin/questions/${id}/reject`),
  batchApprove: (ids: number[]) => api.post('/admin/questions/batch-approve', { ids }),
  articles: (params: any) => api.get('/admin/articles', { params }),
  sources: () => api.get('/admin/sources'),
  createSource: (data: any) => api.post('/admin/sources', data),
  aiTasks: (params: any) => api.get('/admin/ai-tasks', { params }),
  aiGenerate: (data: any) => api.post('/admin/ai/generate', data),
  crawlerStatus: () => api.get('/admin/crawler/status'),
  triggerCrawl: () => api.post('/admin/crawler/crawl'),
  triggerProcess: (limit = 3) => api.post('/admin/crawler/process', { limit }),
  processArticle: (id: number, count = 3) => api.post(`/admin/crawler/process-article/${id}`, { count }),
  papers: (params: any) => api.get('/admin/papers', { params }),
  paperDetail: (id: number) => api.get(`/admin/papers/${id}`),
  createPaper: (data: any) => api.post('/admin/papers', data),
  updatePaper: (id: number, data: any) => api.put(`/admin/papers/${id}`, data),
  deletePaper: (id: number) => api.delete(`/admin/papers/${id}`),
  createMaterial: (paperId: number, data: any) => api.post(`/admin/papers/${paperId}/materials`, data),
  updateMaterial: (id: number, data: any) => api.put(`/admin/materials/${id}`, data),
  deleteMaterial: (id: number) => api.delete(`/admin/materials/${id}`),
  createPaperQuestion: (paperId: number, data: any) => api.post(`/admin/papers/${paperId}/questions`, data),
  updatePaperQuestion: (id: number, data: any) => api.put(`/admin/paper-questions/${id}`, data),
  deletePaperQuestion: (id: number) => api.delete(`/admin/paper-questions/${id}`),
  attempts: (params: any) => api.get('/admin/attempts', { params }),
  practiceRecords: (params: any) => api.get('/admin/practice-records', { params }),
  practiceRecordDetail: (recordType: string, id: number) => api.get(`/admin/practice-records/${recordType}/${id}`),
  aiRequestLogs: (params: any) => api.get('/admin/ai-request-logs', { params }),
  aiRequestLogDetail: (id: number) => api.get(`/admin/ai-request-logs/${id}`),
  feedbacks: (params: any) => api.get('/admin/feedbacks', { params }),
  updateFeedback: (id: number, data: any) => api.put(`/admin/feedbacks/${id}`, data),
  announcements: (params: any) => api.get('/admin/announcements', { params }),
  createAnnouncement: (data: any) => api.post('/admin/announcements', data),
  updateAnnouncement: (id: number, data: any) => api.put(`/admin/announcements/${id}`, data),
  deleteAnnouncement: (id: number) => api.delete(`/admin/announcements/${id}`),
  quality: () => api.get('/admin/quality'),
}
