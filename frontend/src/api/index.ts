import axios from 'axios'

const api = axios.create({
  baseURL: '/PolicyQuest/api',
  timeout: 30000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('pq_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pq_token')
      localStorage.removeItem('pq_user')
      window.location.hash = '#/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export default api

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
}

export const questionApi = {
  list: (params: any) => api.get('/questions', { params }),
  random: (params: any) => api.get('/questions/random', { params }),
  detail: (id: number) => api.get(`/questions/${id}`),
  stats: () => api.get('/questions/stats'),
}

export const practiceApi = {
  start: (data: any) => api.post('/practice/start', data),
  answer: (sessionId: number, data: any) => api.post(`/practice/${sessionId}/answer`, data),
  submit: (sessionId: number) => api.post(`/practice/${sessionId}/submit`),
  history: (params: any) => api.get('/practice/history', { params }),
}

export const wrongbookApi = {
  list: (params: any) => api.get('/wrongbook/wrong', { params }),
  master: (id: number) => api.put(`/wrongbook/wrong/${id}/master`),
  remove: (id: number) => api.delete(`/wrongbook/wrong/${id}`),
  favorites: (params: any) => api.get('/wrongbook/favorites', { params }),
  toggleFav: (qid: number) => api.post(`/wrongbook/favorites/${qid}`),
}

export const statsApi = {
  overview: () => api.get('/stats/overview'),
}

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params: any) => api.get('/admin/users', { params }),
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
}
