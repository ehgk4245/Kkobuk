import { useState, useRef, useEffect } from 'react'
import {
  Settings,
  BarChart2,
  Camera,
  Play,
  Square,
  Pause,
  Maximize,
  PictureInPicture2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWebcam } from '../context/WebcamContext'

export default function Main() {
  const navigate = useNavigate()
  const { stream } = useWebcam()
  const videoRef = useRef(null)
  const miniVideoRef = useRef(null)

  // TODO: 전역 상태 또는 웹캠 분석 결과와 연동
  const [isGoodPosture] = useState(true)
  const [isTracking, setIsTracking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMiniMode, setIsMiniMode] = useState(false)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    if (miniVideoRef.current && stream) {
      miniVideoRef.current.srcObject = stream
    }
  }, [stream, isMiniMode])

  const handleStop = () => {
    setIsTracking(false)
    setIsPaused(false)
  }
  const handlePause = () => setIsPaused(true)
  const handleResume = () => setIsPaused(false)

  const toggleMiniMode = () => {
    if (isMiniMode) {
      window.api?.windowControl?.setNormalMode()
      setIsMiniMode(false)
    } else {
      window.api?.windowControl?.setMiniMode()
      setIsMiniMode(true)
    }
  }

  if (isMiniMode) {
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
          {stream && isTracking && !isPaused ? (
            <video
              ref={miniVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
              <Camera
                size={36}
                className={`mb-2 transition-transform ${isTracking ? 'opacity-40' : 'opacity-20'}`}
              />
            </div>
          )}
          {isTracking && (
            <div
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] py-2 text-center rounded-full font-extrabold shadow-lg text-sm transition-colors ${
                isPaused
                  ? 'bg-blue-600/90 text-white'
                  : isGoodPosture
                    ? 'bg-[#8BC34A]/90 text-white'
                    : 'bg-[#FFC107]/90 text-gray-900'
              }`}
            >
              {isPaused ? '⏸ 일시정지' : isGoodPosture ? '바른 자세 유지!' : '거북목 주의!'}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-auto" style={{ WebkitAppRegion: 'no-drag' }}>
          {!isTracking ? (
            <button
              onClick={() => setIsTracking(true)}
              className="p-4 bg-[#8BC34A] hover:bg-[#7CB342] rounded-2xl text-white shadow-lg transition-transform hover:-translate-y-1"
            >
              <Play fill="currentColor" size={20} />
            </button>
          ) : (
            <>
              <button
                onClick={handleStop}
                className="p-4 bg-gray-700 border border-gray-600 hover:bg-gray-600 rounded-2xl text-red-400 shadow-md transition-transform hover:-translate-y-1"
              >
                <Square fill="currentColor" size={18} />
              </button>
              <button
                title={isPaused ? '재개' : '일시 정지'}
                onClick={isPaused ? handleResume : handlePause}
                className={`p-4 border rounded-2xl shadow-md transition-transform hover:-translate-y-1 ${isPaused ? 'bg-[#8BC34A] border-[#8BC34A] text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400'}`}
              >
                {isPaused ? (
                  <Play fill="currentColor" size={18} />
                ) : (
                  <Pause fill="currentColor" size={18} />
                )}
              </button>
            </>
          )}
          <div className="w-px h-8 bg-gray-700 my-auto mx-1"></div>
          <button
            onClick={toggleMiniMode}
            className="p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white shadow-lg transition-transform hover:-translate-y-1"
            title="큰 화면 복귀"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full h-full bg-gray-900 text-gray-100 p-6 flex flex-col font-sans transition-colors duration-300">
      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-3xl mx-auto py-2">
        <div className="w-full flex justify-end gap-3 mb-5">
          <button
            onClick={toggleMiniMode}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 rounded-2xl shadow-sm hover:bg-gray-700 transition border border-gray-700 hover:border-gray-600"
            title="위젯 모드 전환"
          >
            <PictureInPicture2 size={18} className="text-blue-400" />
            <span className="text-sm font-bold text-gray-200">위젯 모드</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 rounded-2xl shadow-sm hover:bg-gray-700 transition border border-gray-700 hover:border-gray-600"
            title="통계 대시보드"
          >
            <BarChart2 size={18} className="text-[#8BC34A]" />
            <span className="text-sm font-bold text-gray-200">주간 통계</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 rounded-2xl shadow-sm hover:bg-gray-700 transition border border-gray-700 hover:border-gray-600"
            title="환경 설정"
          >
            <Settings size={18} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-200">설정</span>
          </button>
        </div>

        <div
          className={`relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700 ease-in-out border-4 ${
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
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${
                isTracking && !isPaused ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {(!isTracking || isPaused) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
              <Camera
                size={64}
                strokeWidth={1.5}
                className="mb-4 opacity-20"
              />
              <span className="text-sm font-bold tracking-widest opacity-20">
                {isPaused ? 'PAUSED' : 'CAMERA OFF'}
              </span>
            </div>
          )}

          {isTracking && (
            <div className="absolute bottom-8 left-0 w-full flex flex-col items-center z-10">
              {isPaused ? (
                <div className="px-8 py-3 rounded-full font-extrabold text-lg shadow-xl backdrop-blur-md bg-blue-600/90 text-white">
                  ⏸ 일시정지
                </div>
              ) : (
                <>
                  <div className="mb-3 drop-shadow-xl transform transition-transform duration-300 hover:scale-110">
                    {isGoodPosture ? (
                      <span className="text-6xl">😄</span>
                    ) : (
                      <span className="text-6xl">😢</span>
                    )}
                  </div>
                  <div
                    className={`px-8 py-3 rounded-full font-extrabold text-lg shadow-xl backdrop-blur-md transition-colors ${
                      isGoodPosture ? 'bg-[#8BC34A]/90 text-white' : 'bg-[#FFC107]/90 text-gray-900'
                    }`}
                  >
                    {isGoodPosture ? '바른 자세 유지 중!' : '앗, 거북목 주의!'}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4 w-full max-w-md">
          {!isTracking ? (
            <button
              onClick={() => setIsTracking(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#8BC34A] hover:bg-[#7CB342] text-white rounded-2xl font-extrabold shadow-lg transition-all hover:-translate-y-1"
            >
              <Play size={20} fill="currentColor" /> 판별 시작하기
            </button>
          ) : (
            <>
              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-red-400 rounded-2xl font-extrabold shadow-md transition-all hover:-translate-y-1 hover:text-red-300"
              >
                <Square size={18} fill="currentColor" /> 중지하기
              </button>
              <button
                onClick={isPaused ? handleResume : handlePause}
                className={`flex-none flex items-center justify-center w-14 py-4 border rounded-2xl shadow-md transition-all hover:-translate-y-1 ${isPaused ? 'bg-[#8BC34A] border-[#8BC34A] text-white' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400'}`}
                title={isPaused ? '재개' : '일시 정지'}
              >
                {isPaused ? (
                  <Play size={20} fill="currentColor" />
                ) : (
                  <Pause size={20} fill="currentColor" />
                )}
              </button>
            </>
          )}
        </div>

        <div className="mt-8 w-full flex gap-6">
          <div className="flex-1 bg-gray-800 rounded-[2rem] p-6 shadow-md border border-gray-700 transform transition-transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#8BC34A]/20 flex items-center justify-center text-[#8BC34A] text-lg">
                🎯
              </div>
              <h2 className="font-bold text-gray-300">오늘 바른 자세 비율</h2>
            </div>
            <p className="text-4xl font-extrabold text-[#8BC34A] mt-3 pl-1">85%</p>
          </div>

          <div className="flex-1 bg-gray-800 rounded-[2rem] p-6 shadow-md border border-gray-700 transform transition-transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-lg">
                ⏱️
              </div>
              <h2 className="font-bold text-gray-300">오늘 앱 동작 시간</h2>
            </div>
            <p className="text-4xl font-extrabold text-gray-100 mt-3 pl-1">
              3<span className="text-xl text-gray-400 font-bold mx-1">h</span> 45
              <span className="text-xl text-gray-400 font-bold mx-1">m</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
