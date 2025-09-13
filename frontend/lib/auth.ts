import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from './api'
import type { User, LoginRequest, LoginResponse } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials: LoginRequest) => {
        try {
          console.log('Attempting login with:', credentials)
          const response = await api.post<LoginResponse>('/api/auth/login', credentials)
          console.log('Login response:', response.data)
          
          const { token, user } = response.data
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('jcms_token', token)
          }
          
          set({
            user: {
              _id: user.id,
              username: user.username,
              email: user.email,
              role: { _id: '', name: user.role as any, description: '' },
              isActive: true,
              createdAt: '',
              updatedAt: ''
            },
            token,
            isAuthenticated: true,
          })
        } catch (error: any) {
          console.error('Login error:', error.response?.data || error.message)
          throw new Error(error.response?.data?.message || 'Login failed')
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('jcms_token')
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      setUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'jcms-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)