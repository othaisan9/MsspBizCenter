import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import { Task, TaskStatus } from '@/types'
import { formatDate, getCurrentWeek } from '@/lib/utils'
import Card from '@/components/Card'

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'bg-gray-500',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-500',
  [TaskStatus.REVIEW]: 'bg-amber-500',
  [TaskStatus.COMPLETED]: 'bg-green-500',
  [TaskStatus.CANCELLED]: 'bg-red-500',
}

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '대기',
  [TaskStatus.IN_PROGRESS]: '진행중',
  [TaskStatus.REVIEW]: '검토중',
  [TaskStatus.COMPLETED]: '완료',
  [TaskStatus.CANCELLED]: '취소',
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { year, week } = getCurrentWeek()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await api.get<Task[]>('/tasks', {
        params: { year, week },
      })
      setTasks(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Task 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              업무 일지
            </h1>
            <p className="text-gray-600">
              {year}년 {week}주차 Task 목록
            </p>
          </div>
          <Link
            to="/tasks/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            + 새 Task 추가
          </Link>
        </div>

        {tasks.length === 0 ? (
          <Card className="bg-white text-center py-12">
            <p className="text-gray-600">
              아직 등록된 Task가 없습니다. 새 Task를 추가해보세요!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
              <Link key={task.id} to={`/tasks/${task.id}`}>
                <Card className="bg-white hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs text-white rounded ${
                            statusColors[task.status]
                          }`}
                        >
                          {statusLabels[task.status]}
                        </span>
                        {task.priority === 'urgent' && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                            긴급
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {task.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {task.assignee && (
                          <span>담당자: {task.assignee.name}</span>
                        )}
                        {task.dueDate && (
                          <span>마감일: {formatDate(task.dueDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskList
