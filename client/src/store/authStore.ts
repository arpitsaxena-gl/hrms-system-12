import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import api from '../lib/axios'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearSession: () => void
  setTokens: (token: string, refreshToken: string) => void
  updateUser: (user: Partial<User>) => void
  fetchMe: () => Promise<void>
}

// The persisted store (key `hrms-auth`) is the SINGLE source of truth for the
// session token — no parallel raw localStorage token is written anymore (SEC-6).
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          const { token, refreshToken, user } = data.data
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },
      setTokens: (token, refreshToken) => set({ token, refreshToken, isAuthenticated: true }),
      clearSession: () =>
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
      logout: async () => {
        const { refreshToken } = get()
        // Best-effort server-side revocation (SEC-7); clear local state regardless.
        try {
          await api.post('/auth/logout', { refreshToken })
        } catch {
          /* ignore network/auth errors on logout */
        }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.data, isAuthenticated: true })
        } catch {
          get().clearSession()
        }
      },
    }),
    {
      name: 'hrms-auth',
      partialize: (s) => ({
        token: s.token,
        refreshToken: s.refreshToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)
