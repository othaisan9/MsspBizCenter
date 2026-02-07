import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import { MeetingNote } from '@/types'
import { formatDate } from '@/lib/utils'
import Card from '@/components/Card'

const MeetingList: React.FC = () => {
  const [meetings, setMeetings] = useState<MeetingNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await api.get<MeetingNote[]>('/meetings')
      setMeetings(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || '회의록 목록을 불러오는데 실패했습니다.')
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회의록</h1>
            <p className="text-gray-600">회의 내용 및 Action Item 관리</p>
          </div>
          <Link
            to="/meetings/new"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            + 새 회의록 작성
          </Link>
        </div>

        {meetings.length === 0 ? (
          <Card className="bg-white text-center py-12">
            <p className="text-gray-600">
              아직 등록된 회의록이 없습니다. 새 회의록을 작성해보세요!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {meetings.map((meeting) => (
              <Link key={meeting.id} to={`/meetings/${meeting.id}`}>
                <Card className="bg-white hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs text-white rounded ${
                            meeting.status === 'published'
                              ? 'bg-green-500'
                              : 'bg-gray-500'
                          }`}
                        >
                          {meeting.status === 'published' ? '발행됨' : '초안'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>회의일: {formatDate(meeting.meetingDate)}</span>
                        {meeting.location && <span>장소: {meeting.location}</span>}
                        {meeting.createdBy && (
                          <span>작성자: {meeting.createdBy.name}</span>
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

export default MeetingList
