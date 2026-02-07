import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { Task } from '@/types'
import { formatDateTime } from '@/lib/utils'
import Card from '@/components/Card'

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchTask(id)
    }
  }, [id])

  const fetchTask = async (taskId: string) => {
    try {
      setLoading(true)
      const response = await api.get<Task>(`/tasks/${taskId}`)
      setTask(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Task를 불러오는데 실패했습니다.')
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

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error || 'Task를 찾을 수 없습니다.'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/tasks')}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← 목록으로
          </button>
        </div>

        <Card className="bg-white">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {task.title}
            </h1>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded">
                {task.status}
              </span>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded">
                {task.priority}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">설명</h3>
              <p className="text-gray-600">{task.description}</p>
            </div>

            {task.assignee && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">담당자</h3>
                <p className="text-gray-600">{task.assignee.name}</p>
              </div>
            )}

            {task.dueDate && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">마감일</h3>
                <p className="text-gray-600">{formatDateTime(task.dueDate)}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">생성일</h3>
              <p className="text-gray-600">{formatDateTime(task.createdAt)}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">수정일</h3>
              <p className="text-gray-600">{formatDateTime(task.updatedAt)}</p>
            </div>
          </div>
        </Card>

        <div className="mt-6">
          <Card className="bg-white">
            <h2 className="text-xl font-bold text-gray-900 mb-4">댓글</h2>
            <p className="text-gray-600">아직 댓글이 없습니다.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TaskDetail
