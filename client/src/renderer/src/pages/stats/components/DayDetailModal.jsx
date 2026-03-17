import PropTypes from 'prop-types'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatDuration } from '../../../utils/formatDuration'

export default function DayDetailModal({ data, onClose }) {
  if (!data) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-3xl p-6 w-full max-w-xs shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-extrabold text-white">{data.label}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-500 text-xs mb-4">총 {formatDuration(data.totalDurationSec)} 측정</p>

        {data.totalDurationSec > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={[
                    { name: '바른 자세', value: data.goodPostureSec },
                    { name: '거북목', value: data.badPostureSec }
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
            <div className="flex justify-around mt-1">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#8BC34A] shrink-0" />
                  <p className="text-xs text-gray-400">바른 자세</p>
                </div>
                <p className="font-extrabold text-[#8BC34A]">
                  {Math.round((data.goodPostureSec / data.totalDurationSec) * 100)}%
                </p>
                <p className="text-[11px] text-gray-600">{formatDuration(data.goodPostureSec)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FFC107] shrink-0" />
                  <p className="text-xs text-gray-400">거북목</p>
                </div>
                <p className="font-extrabold text-[#FFC107]">
                  {Math.round((data.badPostureSec / data.totalDurationSec) * 100)}%
                </p>
                <p className="text-[11px] text-gray-600">{formatDuration(data.badPostureSec)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-600 text-sm text-center py-6">데이터가 없어요</p>
        )}
      </div>
    </div>
  )
}

DayDetailModal.propTypes = {
  data: PropTypes.object,
  onClose: PropTypes.func.isRequired
}
