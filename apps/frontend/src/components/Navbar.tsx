import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-indigo-700 text-white'
        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
    }`

  return (
    <nav className="bg-indigo-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white text-2xl font-bold mr-8">
              🏠 MsspBizCenter
            </Link>

            {user && (
              <div className="flex items-center space-x-4">
                <Link to="/tasks" className={navLinkClass('/tasks')}>
                  📋 업무 일지
                </Link>
                <Link to="/meetings" className={navLinkClass('/meetings')}>
                  📝 회의록
                </Link>
                <Link to="/contracts" className={navLinkClass('/contracts')}>
                  📄 계약 관리
                </Link>
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-indigo-100 text-sm">
                {user.name} ({user.role})
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-indigo-700 text-white rounded-md text-sm font-medium hover:bg-indigo-800 transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
