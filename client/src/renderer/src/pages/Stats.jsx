import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer
} from 'recharts'
import { apiFetch } from '../utils/api'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function formatDuration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

function toDateLabel(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_LABELS[d.getDay()]})`
}

function toShortLabel(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function buildWeekSlots() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default function Stats() {
  const navigate = useNavigate()
  const [weekData, setWeekData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    apiFetch('/api/posture/sessions/weekly')
      .then((r) => r.json())
      .then((data) => {
        const slots = buildWeekSlots()
        const filled = slots.map((dateStr) => {
          const found = data.find((x) => x.sessionDate === dateStr)
          return {
            date: dateStr,
            label: toDateLabel(dateStr),
            shortLabel: toShortLabel(dateStr),
            totalDurationSec: found?.totalDurationSec ?? 0,
            goodPostureSec: found?.goodPostureSec ?? 0,
            badPostureSec: found?.badPostureSec ?? 0
          }
        })
        setWeekData(filled)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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
          {/* 주간 바 차트 */}
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h2 className="text-sm font-bold text-gray-400 mb-4">최근 7일 자세 현황</h2>
            {hasSessions ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={weekData}
                    barCategoryGap="30%"
                    onClick={(payload) => {
                      const date = payload?.activePayload?.[0]?.payload?.date
                      if (date) setSelectedDate(date)
                    }}
                  >
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        if (d.totalDurationSec === 0) return null
                        return (
                          <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-xl">
                            <p className="font-bold text-white mb-1">{d.label}</p>
                            <p className="text-[#8BC34A]">
                              바른 자세: {formatDuration(d.goodPostureSec)}
                            </p>
                            <p className="text-[#FFC107]">거북목: {formatDuration(d.badPostureSec)}</p>
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="goodPostureSec"
                      stackId="a"
                      cursor="pointer"
                      onClick={(data) => data?.date && setSelectedDate(data.date)}
                    >
                      {weekData.map((entry) => (
                        <Cell
                          key={entry.date}
                          fill={entry.totalDurationSec === 0 ? '#374151' : '#8BC34A'}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="badPostureSec"
                      stackId="a"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(data) => data?.date && setSelectedDate(data.date)}
                    >
                      {weekData.map((entry) => (
                        <Cell
                          key={entry.date}
                          fill={entry.totalDurationSec === 0 ? '#374151' : '#FFC107'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[11px] text-gray-600 text-center mt-1">
                  날짜를 클릭하면 상세 내용을 볼 수 있어요
                </p>
              </>
            ) : (
              <p className="text-gray-600 text-sm text-center py-8">이번 주 데이터가 없어요</p>
            )}
          </div>

          {/* 일별 요약 리스트 */}
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h2 className="text-sm font-bold text-gray-400 mb-3">일별 요약</h2>
            {hasSessions ? (
              <div className="space-y-2">
                {weekData
                  .filter((d) => d.totalDurationSec > 0)
                  .map((d) => {
                    const goodPct = Math.round((d.goodPostureSec / d.totalDurationSec) * 100)
                    return (
                      <button
                        key={d.date}
                        onClick={() => setSelectedDate(d.date)}
                        className="w-full flex items-center gap-3 p-3 bg-gray-900/50 hover:bg-gray-700/50 rounded-xl transition text-left"
                      >
                        <span className="text-sm text-gray-300 w-24 shrink-0">{d.label}</span>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8BC34A] rounded-full transition-all"
                            style={{ width: `${goodPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#8BC34A] w-10 text-right shrink-0">
                          {goodPct}%
                        </span>
                      </button>
                    )
                  })}
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center py-4">이번 주 데이터가 없어요</p>
            )}
          </div>
        </div>
      )}

      {/* 일별 상세 모달 */}
      {selectedData && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-3xl p-6 w-full max-w-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-white">{selectedData.label}</h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              총 {formatDuration(selectedData.totalDurationSec)} 측정
            </p>

            {selectedData.totalDurationSec > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '바른 자세', value: selectedData.goodPostureSec },
                        { name: '거북목', value: selectedData.badPostureSec }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#8BC34A" />
                      <Cell fill="#FFC107" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* 커스텀 범례 + 수치 (순서 직접 제어) */}
                <div className="flex justify-around mt-1">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#8BC34A] shrink-0" />
                      <p className="text-xs text-gray-400">바른 자세</p>
                    </div>
                    <p className="font-extrabold text-[#8BC34A]">
                      {Math.round(
                        (selectedData.goodPostureSec / selectedData.totalDurationSec) * 100
                      )}
                      %
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {formatDuration(selectedData.goodPostureSec)}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#FFC107] shrink-0" />
                      <p className="text-xs text-gray-400">거북목</p>
                    </div>
                    <p className="font-extrabold text-[#FFC107]">
                      {Math.round(
                        (selectedData.badPostureSec / selectedData.totalDurationSec) * 100
                      )}
                      %
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {formatDuration(selectedData.badPostureSec)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-sm text-center py-6">데이터가 없어요</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
