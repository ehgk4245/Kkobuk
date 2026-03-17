import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useWeeklyStats } from '../../hooks/useWeeklyStats'
import WeeklyBarChart from './components/WeeklyBarChart'
import DailySummaryList from './components/DailySummaryList'
import DayDetailModal from './components/DayDetailModal'

export default function Stats() {
  const navigate = useNavigate()
  const { weekData, loading } = useWeeklyStats()
  const [selectedDate, setSelectedDate] = useState(null)

  const selectedData = selectedDate ? weekData.find((d) => d.date === selectedDate) : null
  const hasSessions = weekData.some((d) => d.totalDurationSec > 0)

  return (
    <div className="min-h-full bg-gray-900 text-gray-100 p-6 flex flex-col font-sans">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-800 rounded-xl transition text-gray-400 hover:text-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold">주간 통계</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          로딩 중...
        </div>
      ) : (
        <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h2 className="text-sm font-bold text-gray-400 mb-4">최근 7일 자세 현황</h2>
            {hasSessions ? (
              <WeeklyBarChart weekData={weekData} onDateSelect={setSelectedDate} />
            ) : (
              <p className="text-gray-600 text-sm text-center py-8">이번 주 데이터가 없어요</p>
            )}
          </div>

          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h2 className="text-sm font-bold text-gray-400 mb-3">일별 요약</h2>
            {hasSessions ? (
              <DailySummaryList weekData={weekData} onDateSelect={setSelectedDate} />
            ) : (
              <p className="text-gray-600 text-sm text-center py-4">이번 주 데이터가 없어요</p>
            )}
          </div>
        </div>
      )}

      <DayDetailModal data={selectedData} onClose={() => setSelectedDate(null)} />
    </div>
  )
}
