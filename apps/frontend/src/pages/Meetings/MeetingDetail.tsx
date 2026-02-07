import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { MeetingNote } from '@/types'
import { formatDateTime } from '@/lib/utils'
import Card from '@/components/Card'

const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [meeting, setMeeting] = useState<MeetingNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchMeeting(id)
    }
  }, [id])

  const fetchMeeting = async (meetingId: string) => {
    try {
      setLoading(true)
      const response = await api.get<MeetingNote>(`/meetings/${meetingId}`)
      setMeeting(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || '회의록을 불러오는데 실패했습니다.')
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

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">
          {error || '회의록을 찾을 수 없습니다.'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/meetings')}
            className="text-green-600 hover:text-green-800 mb-4"
          >
            ← 목록으로
          </button>
        </div>

        <Card className="bg-white">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {meeting.title}
            </h1>
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 text-white text-sm rounded ${
                  meeting.status === 'published' ? 'bg-green-500' : 'bg-gray-500'
                }`}
              >
                {meeting.status === 'published' ? '발행됨' : '초안'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                회의 내용
              </h3>
              <div className="text-gray-600 whitespace-pre-wrap">
                {meeting.content}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">회의일</h3>
              <p className="text-gray-600">{formatDateTime(meeting.meetingDate)}</p>
            </div>

            {meeting.location && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">장소</h3>
                <p className="text-gray-600">{meeting.location}</p>
              </div>
            )}

            {meeting.createdBy && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">작성자</h3>
                <p className="text-gray-600">{meeting.createdBy.name}</p>
              </div>
            )}
          </div>
        </Card>

        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="mt-6">
            <Card className="bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-4">참석자</h2>
              <ul className="space-y-2">
                {meeting.attendees.map((attendee) => (
                  <li key={attendee.id} className="text-gray-600">
                    {attendee.user?.name || '알 수 없음'}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {meeting.actionItems && meeting.actionItems.length > 0 && (
          <div className="mt-6">
            <Card className="bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Action Items
              </h2>
              <ul className="space-y-2">
                {meeting.actionItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      readOnly
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-gray-900">{item.description}</p>
                      {item.assignee && (
                        <p className="text-sm text-gray-500">
                          담당: {item.assignee.name}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default MeetingDetail
