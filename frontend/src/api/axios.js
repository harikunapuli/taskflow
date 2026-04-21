import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth API calls ────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  me:       ()      => api.get('/auth/me'),
}

// ── Project API calls ─────────────────────────────
export const projectAPI = {
  getAll:   ()          => api.get('/tasks/projects'),
  getOne:   (id)        => api.get(`/tasks/projects/${id}`),
  create:   (data)      => api.post('/tasks/projects', data),
  update:   (id, data)  => api.put(`/tasks/projects/${id}`, data),
  delete:   (id)        => api.delete(`/tasks/projects/${id}`),
}

// ── Task API calls ────────────────────────────────
export const taskAPI = {
  getAll:   (params)    => api.get('/tasks/tasks', { params }),
  getOne:   (id)        => api.get(`/tasks/tasks/${id}`),
  create:   (data)      => api.post('/tasks/tasks', data),
  update:   (id, data)  => api.patch(`/tasks/tasks/${id}`, data),
  delete:   (id)        => api.delete(`/tasks/tasks/${id}`),
}

// ── Comment API calls ─────────────────────────────
export const commentAPI = {
  getAll:   (taskId)        => api.get(`/tasks/tasks/${taskId}/comments`),
  create:   (taskId, data)  => api.post(`/tasks/tasks/${taskId}/comments`, data),
}

// ── Notification API calls ────────────────────────
export const notifAPI = {
  getAll:       ()    => api.get('/notif/notifications'),
  unreadCount:  ()    => api.get('/notif/notifications/unread-count'),
  markRead:     (id)  => api.patch(`/notif/notifications/${id}/read`),
}

export default api