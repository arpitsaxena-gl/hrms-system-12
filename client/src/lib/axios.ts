import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

// Configurable API base URL for production; falls back to the Vite dev proxy (SEC-6 / prod config).
const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || '/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    // Single source of truth for the session token: the auth store.
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const { refreshToken, setTokens, clearSession } = useAuthStore.getState()
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
          setTokens(data.data.token, data.data.refreshToken)
          originalRequest.headers.Authorization = `Bearer ${data.data.token}`
          return api(originalRequest)
        } catch {
          clearSession()
          window.location.href = '/login'
        }
      } else {
        clearSession()
        window.location.href = '/login'
      }
    }
    if (error.response?.status !== 401) {
      toast.error(error.response?.data?.message || error.message || 'Something went wrong')
    }
    return Promise.reject(error)
  }
)

export default api
