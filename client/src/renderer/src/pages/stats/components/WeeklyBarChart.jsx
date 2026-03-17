import PropTypes from 'prop-types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer
} from 'recharts'
import { formatDuration } from '../../../utils/formatDuration'

export default function WeeklyBarChart({ weekData, onDateSelect }) {
  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={weekData}
          barCategoryGap="30%"
          onClick={(payload) => {
            const date = payload?.activePayload?.[0]?.payload?.date
            if (date) onDateSelect(date)
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
                  <p className="text-[#8BC34A]">바른 자세: {formatDuration(d.goodPostureSec)}</p>
                  <p className="text-[#FFC107]">거북목: {formatDuration(d.badPostureSec)}</p>
                </div>
              )
            }}
          />
          <Bar
            dataKey="goodPostureSec"
            stackId="a"
            cursor="pointer"
            onClick={(data) => data?.date && onDateSelect(data.date)}
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
            onClick={(data) => data?.date && onDateSelect(data.date)}
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
  )
}

WeeklyBarChart.propTypes = {
  weekData: PropTypes.array.isRequired,
  onDateSelect: PropTypes.func.isRequired
}
