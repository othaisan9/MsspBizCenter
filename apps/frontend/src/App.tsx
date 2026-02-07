import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'

// Pages
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import TaskList from '@/pages/Tasks/TaskList'
import TaskDetail from '@/pages/Tasks/TaskDetail'
import MeetingList from '@/pages/Meetings/MeetingList'
import MeetingDetail from '@/pages/Meetings/MeetingDetail'
import ContractList from '@/pages/Contracts/ContractList'
import ContractDetail from '@/pages/Contracts/ContractDetail'

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TaskList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute>
                <TaskDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <MeetingList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings/:id"
            element={
              <ProtectedRoute>
                <MeetingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts"
            element={
              <ProtectedRoute>
                <ContractList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/:id"
            element={
              <ProtectedRoute>
                <ContractDetail />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
