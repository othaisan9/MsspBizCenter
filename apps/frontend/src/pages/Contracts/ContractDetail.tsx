import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { Contract } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import Card from '@/components/Card'

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchContract(id)
    }
  }, [id])

  const fetchContract = async (contractId: string) => {
    try {
      setLoading(true)
      const response = await api.get<Contract>(`/contracts/${contractId}`)
      setContract(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || '계약을 불러오는데 실패했습니다.')
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

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">
          {error || '계약을 찾을 수 없습니다.'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/contracts')}
            className="text-amber-600 hover:text-amber-800 mb-4"
          >
            ← 목록으로
          </button>
        </div>

        <Card className="bg-white">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {contract.clientName}
            </h1>
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 text-white text-sm rounded ${
                  contract.status === 'active'
                    ? 'bg-green-500'
                    : contract.status === 'expired'
                    ? 'bg-red-500'
                    : contract.status === 'renewed'
                    ? 'bg-blue-500'
                    : 'bg-gray-500'
                }`}
              >
                {contract.status === 'active'
                  ? '활성'
                  : contract.status === 'expired'
                  ? '만료'
                  : contract.status === 'renewed'
                  ? '갱신'
                  : '취소'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                계약번호
              </h3>
              <p className="text-gray-600">{contract.contractNumber}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                계약 기간
              </h3>
              <p className="text-gray-600">
                {formatDate(contract.startDate)} ~ {formatDate(contract.endDate)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                계약 금액
              </h3>
              <p className="text-gray-600">
                {contract.amount || '권한이 없습니다'}
              </p>
            </div>

            {contract.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">설명</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {contract.description}
                </p>
              </div>
            )}

            {contract.createdBy && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  작성자
                </h3>
                <p className="text-gray-600">{contract.createdBy.name}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">생성일</h3>
              <p className="text-gray-600">{formatDateTime(contract.createdAt)}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">수정일</h3>
              <p className="text-gray-600">{formatDateTime(contract.updatedAt)}</p>
            </div>
          </div>
        </Card>

        {contract.history && contract.history.length > 0 && (
          <div className="mt-6">
            <Card className="bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-4">변경 이력</h2>
              <div className="space-y-4">
                {contract.history.map((item) => (
                  <div
                    key={item.id}
                    className="border-l-4 border-amber-500 pl-4 py-2"
                  >
                    <p className="font-semibold text-gray-900">{item.action}</p>
                    {item.performedBy && (
                      <p className="text-sm text-gray-600">
                        {item.performedBy.name} - {formatDateTime(item.createdAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContractDetail
