import PropTypes from 'prop-types'
import { Loader2 } from 'lucide-react'

const PRE_COUNTDOWN_SECONDS = 3
const BASELINE_SECONDS = 5

export default function BaselineOverlay({ mini = false, trackingState, countdown, onStart }) {
  const isPreCountdown = trackingState === 'baseline_pre' || trackingState === 'recalibrating_pre'
  const isCollecting = trackingState === 'baseline_collecting' || trackingState === 'recalibrating'
  const isRecalibration = trackingState === 'recalibrating_pre' || trackingState === 'recalibrating'

  return (
    <div
      className={`absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-20 ${mini ? 'rounded-[2rem]' : 'rounded-[2.5rem]'}`}
    >
      {isPreCountdown ? (
        <>
          <p className={`text-gray-300 font-bold ${mini ? 'text-xs' : 'text-sm'} mb-2`}>
            바른 자세를 취해주세요
          </p>
          <p className={`font-extrabold text-[#8BC34A] ${mini ? 'text-4xl' : 'text-6xl'}`}>
            {countdown}
          </p>
          <p className={`text-gray-500 mt-2 ${mini ? 'text-[10px]' : 'text-xs'} text-center`}>
            {countdown}초 후 측정 시작
          </p>
        </>
      ) : isCollecting ? (
        <>
          <p className={`text-gray-300 font-bold ${mini ? 'text-xs' : 'text-sm'} mb-2`}>
            {isRecalibration ? '베이스라인 재측정 중' : '베이스라인 측정 중'}
          </p>
          {countdown > 0 ? (
            <p className={`font-extrabold text-[#8BC34A] ${mini ? 'text-4xl' : 'text-6xl'}`}>
              {countdown}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 size={mini ? 16 : 20} className="animate-spin" />
              <span className={mini ? 'text-xs' : 'text-sm'}>서버 처리 중...</span>
            </div>
          )}
          <p className={`text-gray-500 mt-3 ${mini ? 'text-[10px]' : 'text-xs'} text-center`}>
            허리를 펴고 목을 당겨
            <br />
            바른 자세를 유지해 주세요
          </p>
        </>
      ) : (
        <>
          <p
            className={`text-white font-extrabold ${mini ? 'text-sm' : 'text-lg'} mb-2 text-center`}
          >
            바른 자세로 앉아주세요
          </p>
          {!mini && (
            <p className="text-gray-400 text-xs mb-4 text-center leading-relaxed px-6">
              현재 카메라 각도와 환경을 기준으로 자세를 측정합니다.
              <br />
              시작 후 <span className="text-[#8BC34A] font-bold">
                {PRE_COUNTDOWN_SECONDS}초
              </span>{' '}
              대기, 이후 <span className="text-[#8BC34A] font-bold">{BASELINE_SECONDS}초</span>간
              바른 자세를 유지해 주세요.
            </p>
          )}
          <button
            onClick={onStart}
            className={`bg-[#8BC34A] hover:bg-[#7CB342] text-white font-extrabold rounded-2xl transition-all hover:-translate-y-0.5 ${mini ? 'px-4 py-2 text-xs mb-2' : 'px-6 py-3 text-sm mb-4'}`}
          >
            측정 시작
          </button>
          {!mini && (
            <p className="text-gray-600 text-[11px] text-center leading-relaxed px-6">
              💡 카메라 각도나 환경이 바뀌면 추론 중 재측정 버튼(↺)을 눌러 다시 측정해 주세요.
            </p>
          )}
        </>
      )}
    </div>
  )
}

BaselineOverlay.propTypes = {
  mini: PropTypes.bool,
  trackingState: PropTypes.string.isRequired,
  countdown: PropTypes.number.isRequired,
  onStart: PropTypes.func.isRequired
}
