import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import { Contract } from '@/types'
import { formatDate } from '@/lib/utils'
import Card from '@/components/Card'

const ContractList: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const response = await api.get<Contract[]>('/contracts')
      setContracts(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || '계약 목록을 불러오는데 실패했습니다.')
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">계약 관리</h1>
            <p className="text-gray-600">계약 정보 및 만료 알림 관리</p>
          </div>
          <Link
            to="/contracts/new"
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            + 새 계약 추가
          </Link>
        </div>

        {contracts.length === 0 ? (
          <Card className="bg-white text-center py-12">
            <p className="text-gray-600">
              아직 등록된 계약이 없습니다. 새 계약을 추가해보세요!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {contracts.map((contract) => (
              <Link key={contract.id} to={`/contracts/${contract.id}`}>
                <Card className="bg-white hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs text-white rounded ${
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {contract.clientName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        계약번호: {contract.contractNumber}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          계약기간: {formatDate(contract.startDate)} ~{' '}
                          {formatDate(contract.endDate)}
                        </span>
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

export default ContractList
