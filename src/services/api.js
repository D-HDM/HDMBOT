import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hdm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hdm_token')
      localStorage.removeItem('hdm_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  verify: (token) => api.get('/auth/verify', { headers: { Authorization: `Bearer ${token}` } }),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
}

export const whatsappAPI = {
  getStatus: () => api.get('/whatsapp/status'),
  connect: () => api.post('/whatsapp/start'),
  disconnect: () => api.post('/whatsapp/disconnect'),
  reconnect: () => api.post('/whatsapp/restart'),
}

export const messageAPI = {
  send: (to, message) => api.post('/messages/send', { to, message }),
  getAll: (page = 1, limit = 50, chat = '') =>
    api.get('/messages', { params: { page, limit, chat } }),
  getStats: () => api.get('/messages/stats'),
  importBatch: (messages) => api.post('/messages/import', messages),
}

export const ruleAPI = {
  getAll: () => api.get('/rules'),
  create: (data) => api.post('/rules', data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  delete: (id) => api.delete(`/rules/${id}`),
  toggle: (id) => api.patch(`/rules/${id}/toggle`),
}

export const commandAPI = {
  getAll: () => api.get('/commands'),
  create: (data) => api.post('/commands', data),
  update: (id, data) => api.put(`/commands/${id}`, data),
  delete: (id) => api.delete(`/commands/${id}`),
}

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (key, value) => api.put('/settings', { key, value }),
  get: (key) => api.get(`/settings/${key}`),
}

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getMessages: (days = 7) => api.get('/analytics/messages', { params: { days } }),
}

export const backupAPI = {
  full: () => api.get('/backup/full'),
}

export const adminAPI = {
  getStatus: (key) => api.get('/admin/status', { headers: { 'X-API-Key': key || 'hashdm' } }),
  restart: (key) => api.post('/admin/restart', {}, { headers: { 'X-API-Key': key || 'hashdm' } }),
  stop: (key) => api.post('/admin/stop', {}, { headers: { 'X-API-Key': key || 'hashdm' } }),
  clearSessions: (key) => api.delete('/admin/sessions', { headers: { 'X-API-Key': key || 'hashdm' } }),
  clearCache: (key) => api.post('/admin/clear-cache', {}, { headers: { 'X-API-Key': key || 'hashdm' } }),
  getLogs: (key, limit = 100) => api.get('/admin/logs', { headers: { 'X-API-Key': key || 'hashdm' }, params: { limit } }),
}

export default api