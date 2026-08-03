import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

// 请求拦截器 - 自动加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// Chapters
export const chapterAPI = {
  list: (tutorial) => api.get('/chapters', { params: { tutorial } }),
  get: (id) => api.get(`/chapters/${id}`),
  progress: (tutorial) => api.get('/chapters/progress/all', { params: { tutorial } }),
}

// Progress
export const progressAPI = {
  update: (chapterId, status) => api.put(`/progress/${chapterId}`, { status }),
  stats: () => api.get('/progress/stats'),
}

// Files
export const fileAPI = {
  list: (parentId) => api.get('/files', { params: { parent_id: parentId } }),
  tree: () => api.get('/files/tree'),
  get: (id) => api.get(`/files/${id}`),
  create: (data) => api.post('/files', data),
  update: (id, data) => api.put(`/files/${id}`, data),
  delete: (id) => api.delete(`/files/${id}`),
  download: async (id) => {
    const res = await api.get(`/files/${id}/download`, { responseType: 'blob' })
    return res
  },
  downloadZip: async (id) => {
    const res = await api.get(`/files/${id}/download-zip`, { responseType: 'blob' })
    return res
  },
}

// Notes
export const noteAPI = {
  get: (chapterId) => api.get(`/notes/${chapterId}`),
  save: (chapterId, content) => api.put(`/notes/${chapterId}`, { content }),
}

export default api
