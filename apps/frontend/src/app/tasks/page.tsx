export default function TasksPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            주차별 업무 일지
          </h1>
          <p className="text-gray-600 mt-2">
            주차 단위로 업무(Task)를 등록하고 관리합니다.
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <p className="text-lg">Task 기능 준비 중...</p>
            <p className="text-sm mt-2">Phase 1에서 구현 예정</p>
          </div>
        </div>
      </div>
    </main>
  );
}
