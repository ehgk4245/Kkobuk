import PropTypes from 'prop-types'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export default function CaptureCard({ mode, captured, disabled, onCapture }) {
  const isGood = mode === 'good'
  const color = isGood ? '#8BC34A' : '#FFC107'
  const label = isGood ? '바른 자세 촬영' : '거북목 자세 촬영'
  const desc = isGood ? (
    <>
      허리를 펴고 목을 당겨
      <br />
      바른 자세를 취해 주세요
    </>
  ) : (
    <>
      자연스럽게 나오는 거북목
      <br />
      자세를 취해 주세요
    </>
  )

  return (
    <div
      className={`flex-1 bg-gray-800 rounded-3xl p-6 shadow-md border shadow-lg ${
        captured
          ? isGood
            ? 'border-[#8BC34A]'
            : 'border-[#FFC107]'
          : 'border-transparent'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: color + '1a', color }}
        >
          {isGood ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
        </div>
        <div className="text-center">
          <div className="font-extrabold text-white text-lg">
            {label}{' '}
            {captured && (
              <span className="text-sm ml-1" style={{ color }}>
                ✓ 완료
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1.5 font-medium">{desc}</div>
        </div>
        <button
          onClick={() => onCapture(mode)}
          disabled={disabled}
          className={`mt-1 px-5 py-1.5 rounded-full text-sm font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed ${
            isGood
              ? 'border-[#8BC34A] text-[#8BC34A] hover:bg-[#8BC34A]/10 disabled:hover:bg-transparent'
              : 'border-[#FFC107] text-[#FFC107] hover:bg-[#FFC107]/10 disabled:hover:bg-transparent'
          }`}
        >
          {captured ? '다시 학습하기' : '학습하기'}
        </button>
      </div>
    </div>
  )
}

CaptureCard.propTypes = {
  mode: PropTypes.oneOf(['good', 'bad']).isRequired,
  captured: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  onCapture: PropTypes.func.isRequired
}
