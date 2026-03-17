import PropTypes from 'prop-types'
import { formatDuration } from '../../../utils/formatDuration'

export default function SessionSummary({ sessionGoodSec, sessionBadSec }) {
  const total = sessionGoodSec + sessionBadSec
  if (total === 0) return null

  return (
    <div className="mt-4 w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 flex items-center gap-4">
      <span className="text-xs text-gray-500 shrink-0">현재 세션</span>
      <div className="flex flex-1 justify-around">
        <div className="text-center">
          <p className="text-[10px] text-gray-500">바른 자세</p>
          <p className="text-sm font-extrabold text-[#8BC34A]">{formatDuration(sessionGoodSec)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500">거북목</p>
          <p className="text-sm font-extrabold text-[#FFC107]">{formatDuration(sessionBadSec)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500">바른 자세율</p>
          <p className="text-sm font-extrabold text-white">
            {Math.round((sessionGoodSec / total) * 100)}%
          </p>
        </div>
      </div>
    </div>
  )
}

SessionSummary.propTypes = {
  sessionGoodSec: PropTypes.number.isRequired,
  sessionBadSec: PropTypes.number.isRequired
}
