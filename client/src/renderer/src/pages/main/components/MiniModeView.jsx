import PropTypes from 'prop-types'
import { Camera, Play, Square, Pause, Maximize, Loader2 } from 'lucide-react'

export default function MiniModeView({
  stream,
  videoRef,
  trackingState,
  isGoodPosture,
  postureProba,
  countdown,
  wsError,
  mpReady,
  onStart,
  onStop,
  onPause,
  onResume,
  onToggleMini
}) {
  const isTracking = trackingState !== 'idle' && trackingState !== 'connecting'
  const isPaused = trackingState === 'paused'
  const isConnecting = trackingState === 'connecting'
  const isLiveTracking = trackingState === 'tracking'
  const isMeasuring = trackingState === 'baseline_collecting' || trackingState === 'recalibrating'
  const showBaselineOverlay =
    trackingState === 'baseline_prompt' ||
    trackingState === 'baseline_pre' ||
    trackingState === 'recalibrating_pre'

  return (
    <div
      className="h-full w-full bg-gray-900 flex flex-col items-center justify-center p-5 select-none transition-colors duration-300 relative z-10"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div
        className={`relative w-full aspect-square bg-black rounded-[2rem] overflow-hidden border-4 mb-6 shadow-2xl transition-colors duration-500 ${
          !isTracking
            ? 'border-gray-800'
            : isPaused
              ? 'border-blue-600 shadow-blue-600/20'
              : isGoodPosture
                ? 'border-[#8BC34A] shadow-[#8BC34A]/20'
                : 'border-[#FFC107] shadow-[#FFC107]/20'
        }`}
      >
        {stream && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isTracking && !isPaused ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {(!isTracking || isPaused) && !showBaselineOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
            <Camera
              size={36}
              className={`mb-2 transition-transform ${isTracking ? 'opacity-40' : 'opacity-20'}`}
            />
          </div>
        )}
        {isTracking && isLiveTracking && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] flex flex-col items-center gap-1">
            <div
              className={`w-full py-2 text-center rounded-full font-extrabold shadow-lg text-sm transition-colors ${
                isGoodPosture ? 'bg-[#8BC34A]/90 text-white' : 'bg-[#FFC107]/90 text-gray-900'
              }`}
            >
              {isGoodPosture ? '바른 자세 유지!' : '거북목 주의!'}
            </div>
            {postureProba !== null && (
              <div className="text-[10px] font-bold text-gray-300 bg-black/50 px-2.5 py-0.5 rounded-full">
                {Math.round(postureProba * 100)}%
              </div>
            )}
          </div>
        )}
        {isPaused && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] py-2 text-center rounded-full font-extrabold shadow-lg text-sm bg-blue-600/90 text-white">
            ⏸ 일시정지
          </div>
        )}
        {isMeasuring && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-white text-[10px] font-bold">측정 중</span>
            {countdown > 0 ? (
              <span className="text-[#8BC34A] font-extrabold text-sm w-4 text-center">
                {countdown}
              </span>
            ) : (
              <Loader2 size={12} className="text-gray-300 animate-spin" />
            )}
          </div>
        )}
        {showBaselineOverlay && (
          <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-20 rounded-[2rem] px-4 text-center">
            <p className="text-white font-extrabold text-sm mb-1">전체 화면에서 측정해주세요</p>
            <p className="text-gray-500 text-[10px] mb-4 leading-relaxed">
              자세 기준 측정은
              <br />
              전체 화면에서만 가능합니다
            </p>
            <button
              onClick={onToggleMini}
              className="px-4 py-2 bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-extrabold rounded-2xl transition-all"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              전체 화면으로 이동
            </button>
          </div>
        )}
      </div>

      {wsError && <p className="text-red-400 text-[10px] text-center mb-2 px-2">{wsError}</p>}

      <div className="flex gap-3 mt-auto" style={{ WebkitAppRegion: 'no-drag' }}>
        {!isTracking && !isConnecting ? (
          <button
            onClick={onStart}
            disabled={!mpReady}
            className="p-4 bg-[#8BC34A] hover:bg-[#7CB342] rounded-2xl text-white shadow-lg transition-transform hover:-translate-y-1 disabled:opacity-50"
          >
            <Play fill="currentColor" size={20} />
          </button>
        ) : isConnecting ? (
          <div className="p-4 bg-gray-700 rounded-2xl text-gray-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            <button
              onClick={onStop}
              className="p-4 bg-gray-700 border border-gray-600 hover:bg-gray-600 rounded-2xl text-red-400 shadow-md transition-transform hover:-translate-y-1"
            >
              <Square fill="currentColor" size={18} />
            </button>
            {(isLiveTracking || isPaused) && (
              <button
                onClick={isPaused ? onResume : onPause}
                className={`p-4 border rounded-2xl shadow-md transition-transform hover:-translate-y-1 ${isPaused ? 'bg-[#8BC34A] border-[#8BC34A] text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400'}`}
              >
                {isPaused ? (
                  <Play fill="currentColor" size={18} />
                ) : (
                  <Pause fill="currentColor" size={18} />
                )}
              </button>
            )}
          </>
        )}
        <div className="w-px h-8 bg-gray-700 my-auto mx-1"></div>
        <button
          onClick={onToggleMini}
          className="p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white shadow-lg transition-transform hover:-translate-y-1"
          title="큰 화면 복귀"
        >
          <Maximize size={20} />
        </button>
      </div>
    </div>
  )
}

MiniModeView.propTypes = {
  stream: PropTypes.object,
  videoRef: PropTypes.object.isRequired,
  trackingState: PropTypes.string.isRequired,
  isGoodPosture: PropTypes.bool.isRequired,
  postureProba: PropTypes.number,
  countdown: PropTypes.number.isRequired,
  wsError: PropTypes.string,
  mpReady: PropTypes.bool.isRequired,
  onStart: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onResume: PropTypes.func.isRequired,
  onToggleMini: PropTypes.func.isRequired
}
