import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request Interceptor - JWT 토큰 추가
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor - 토큰 갱신 및 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // 401 에러 && 토큰 갱신 시도하지 않았을 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refresh_token: refreshToken }
          )

          const { access_token, refresh_token: newRefreshToken } = response.data

          localStorage.setItem('access_token', access_token)
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken)
          }

          // 원래 요청 재시도
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`
          }
          return api(originalRequest)
        } catch (refreshError) {
          // 토큰 갱신 실패 -> 로그아웃
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // 리프레시 토큰이 없으면 로그인 페이지로
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
