import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('pq_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('pq_user') || 'null'))
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin')

  async function login(username: string, password: string) {
    const res: any = await authApi.login({ username, password })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('pq_token', res.data.token)
    localStorage.setItem('pq_user', JSON.stringify(res.data.user))
    return res
  }

  async function register(data: any) {
    const res: any = await authApi.register(data)
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('pq_token', res.data.token)
    localStorage.setItem('pq_user', JSON.stringify(res.data.user))
    return res
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('pq_token')
    localStorage.removeItem('pq_user')
  }

  async function fetchProfile() {
    const res: any = await authApi.profile()
    user.value = res.data
    localStorage.setItem('pq_user', JSON.stringify(res.data))
  }

  async function updateProfile(data: any) {
    const res: any = await authApi.updateProfile(data)
    user.value = res.data || { ...user.value, ...data }
    localStorage.setItem('pq_user', JSON.stringify(user.value))
    return res
  }

  return { token, user, isLoggedIn, isAdmin, login, register, logout, fetchProfile, updateProfile }
})
