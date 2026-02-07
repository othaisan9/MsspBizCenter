export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          MsspBizCenter
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          MSSP 비즈니스 센터 - 팀 업무 포털 시스템
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          {/* Task 카드 */}
          <a
            href="/tasks"
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-3xl mb-3">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              주차별 업무 일지
            </h2>
            <p className="text-gray-600 text-sm">
              주차 단위 Task 관리, 담당자 지정, 진행 상태 추적
            </p>
          </a>

          {/* Meeting 카드 */}
          <a
            href="/meetings"
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-3xl mb-3">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              회의록
            </h2>
            <p className="text-gray-600 text-sm">
              회의 내용 기록, 참석자 관리, Action Item 추적
            </p>
          </a>

          {/* Contract 카드 */}
          <a
            href="/contracts"
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-3xl mb-3">📄</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              계약 관리
            </h2>
            <p className="text-gray-600 text-sm">
              계약 정보 관리, 만료 알림, 갱신 이력 추적
            </p>
          </a>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Version: {process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0-alpha.1'}</p>
        </div>
      </div>
    </main>
  );
}
