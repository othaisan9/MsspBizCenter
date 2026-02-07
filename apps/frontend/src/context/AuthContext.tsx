import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/services/api'
import type { User, LoginCredentials, AuthResponse } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 앱 시작 시 토큰 확인 및 사용자 정보 로드
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const response = await api.get<User>('/auth/me')
          setUser(response.data)
        } catch (error) {
          console.error('Failed to load user:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      const { access_token, refresh_token, user: userData } = response.data

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      setUser(userData)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
