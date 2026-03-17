import PropTypes from 'prop-types'

export default function DailySummaryList({ weekData, onDateSelect }) {
  return (
    <div className="space-y-2">
      {weekData
        .filter((d) => d.totalDurationSec > 0)
        .map((d) => {
          const goodPct = Math.round((d.goodPostureSec / d.totalDurationSec) * 100)
          return (
            <button
              key={d.date}
              onClick={() => onDateSelect(d.date)}
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
  )
}

DailySummaryList.propTypes = {
  weekData: PropTypes.array.isRequired,
  onDateSelect: PropTypes.func.isRequired
}
