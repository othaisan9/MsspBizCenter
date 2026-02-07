import React from 'react'
import { Link } from 'react-router-dom'
import Card from '@/components/Card'
import { useAuth } from '@/context/AuthContext'

interface AppCard {
  title: string
  description: string
  icon: string
  path: string
  color: string
}

const apps: AppCard[] = [
  {
    title: '업무 일지',
    description: '주차별 Task 관리 및 진행 상황 추적',
    icon: '📋',
    path: '/tasks',
    color: 'bg-blue-500',
  },
  {
    title: '회의록',
    description: '회의 내용 기록 및 Action Item 관리',
    icon: '📝',
    path: '/meetings',
    color: 'bg-green-500',
  },
  {
    title: '계약 관리',
    description: '계약 정보 및 만료 알림, 갱신 이력',
    icon: '📄',
    path: '/contracts',
    color: 'bg-amber-500',
  },
]

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MsspBizCenter
          </h1>
          <p className="text-gray-600">
            안녕하세요, {user?.name}님! 오늘도 좋은 하루 되세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Link key={app.path} to={app.path}>
              <Card className={`${app.color} text-white border-none`}>
                <div className="text-5xl mb-4">{app.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{app.title}</h2>
                <p className="text-sm opacity-90">{app.description}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              최근 활동
            </h3>
            <p className="text-gray-600">아직 활동 내역이 없습니다.</p>
          </Card>

          <Card className="bg-white">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              알림
            </h3>
            <p className="text-gray-600">새로운 알림이 없습니다.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
