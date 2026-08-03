import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(username, password) {
    const res = await authAPI.login({ username, password })
    if (res.code === 0) {
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
    }
    return res
  }

  async function register(username, password) {
    const res = await authAPI.register({ username, password })
    if (res.code === 0) {
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
    }
    return res
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const res = await authAPI.me()
      if (res.code === 0) {
        user.value = res.data
      }
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isLoggedIn, login, register, fetchUser, logout }
})
