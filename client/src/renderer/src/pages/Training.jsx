import { useState, useRef, useEffect, useCallback } from 'react'
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { Camera, CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logo from '../../../../resources/icon.png'
import { useWebcam } from '../context/WebcamContext'

const PREPARE_SECONDS = 5
const COLLECT_SECONDS = 60
const LABEL = { good: 0, bad: 1 }
const SAMPLE_INTERVAL_MS = 200

const LANDMARK_IDX = { nose: 0, leftEar: 7, rightEar: 8, leftShoulder: 11, rightShoulder: 12 }
const pickXYZ = ({ x, y, z }) => ({ x, y, z })

const WASM_URL = '/mediapipe-wasm'
const MODEL_URL = '/mediapipe-wasm/pose_landmarker_lite.task'

export default function Training() {
  const navigate = useNavigate()
  const { stream } = useWebcam()
  const videoRef = useRef(null)
  const poseLandmarkerRef = useRef(null)
  const animFrameRef = useRef(null)
  const prepTimerRef = useRef(null)
  const allSamplesRef = useRef([])

  const [mpReady, setMpReady] = useState(false)
  const [mpError, setMpError] = useState(null)

  const [capturedGood, setCapturedGood] = useState(false)
  const [capturedBad, setCapturedBad] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const [capturePhase, setCapturePhase] = useState(null)
  const [captureMode, setCaptureMode] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [frameCount, setFrameCount] = useState(0)

  const bothCaptured = capturedGood && capturedBad
  const isCapturing = capturePhase === 'prepare' || capturePhase === 'collecting'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)
        const lm = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1
        })
        if (!cancelled) {
          poseLandmarkerRef.current = lm
          setMpReady(true)
        }
      } catch (err) {
        console.error('[MediaPipe] 초기화 실패:', err)
        if (!cancelled) setMpError('AI 모델 로드 실패: ' + err.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    }
  }, [])

  const startCollection = useCallback((mode) => {
    setCapturePhase('collecting')
    setElapsedSec(0)
    setFrameCount(0)

    const label = LABEL[mode]
    const sessionSamples = []
    const startTime = performance.now()
    const duration = COLLECT_SECONDS * 1000
    let lastSampleTime = 0

    const collect = () => {
      const now = performance.now()
      const elapsed = now - startTime
      setElapsedSec(Math.min(Math.floor(elapsed / 1000), COLLECT_SECONDS))

      if (elapsed >= duration) {
        allSamplesRef.current = [...allSamplesRef.current, ...sessionSamples]
        if (mode === 'good') setCapturedGood(true)
        else setCapturedBad(true)
        setFrameCount(sessionSamples.length)
        setCapturePhase('done')
        setTimeout(() => {
          setCapturePhase(null)
          setCaptureMode(null)
        }, 1800)
        return
      }

      const video = videoRef.current
      const lm = poseLandmarkerRef.current
      if (video && lm && video.readyState >= 2 && now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
        try {
          const results = lm.detectForVideo(video, now)
          if (results.landmarks?.[0]) {
            const pts = results.landmarks[0]
            sessionSamples.push({
              label,
              nose: pickXYZ(pts[LANDMARK_IDX.nose]),
              leftEar: pickXYZ(pts[LANDMARK_IDX.leftEar]),
              rightEar: pickXYZ(pts[LANDMARK_IDX.rightEar]),
              leftShoulder: pickXYZ(pts[LANDMARK_IDX.leftShoulder]),
              rightShoulder: pickXYZ(pts[LANDMARK_IDX.rightShoulder])
            })
            lastSampleTime = now
            setFrameCount(sessionSamples.length)
          }
        } catch {} // eslint-disable-line no-empty
      }

      animFrameRef.current = requestAnimationFrame(collect)
    }

    animFrameRef.current = requestAnimationFrame(collect)
  }, [])

  const handleCapture = useCallback(
    (mode) => {
      if (!mpReady || isCapturing || isTraining || isComplete) return

      setCaptureMode(mode)
      setCapturePhase('prepare')
      setCountdown(PREPARE_SECONDS)

      let remaining = PREPARE_SECONDS
      prepTimerRef.current = setInterval(() => {
        remaining -= 1
        setCountdown(remaining)
        if (remaining <= 0) {
          clearInterval(prepTimerRef.current)
          startCollection(mode)
        }
      }, 1000)
    },
    [mpReady, isCapturing, isTraining, isComplete, startCollection]
  )

  // TODO: 실제 서버 학습 API 연동 (allSamplesRef.current 전송)
  const handleRequestTraining = () => {
    console.log('[Kkobuk] 수집 샘플 수:', allSamplesRef.current.length)
    setIsTraining(true)
    setTimeout(() => {
      setIsTraining(false)
      setIsComplete(true)
    }, 3000)
  }

  const handleComplete = () => {
    localStorage.setItem('onboardingComplete', 'true')
    navigate('/main')
  }

  const modeLabel = captureMode === 'good' ? '바른 자세' : '거북목 자세'
  const modeColor = captureMode === 'good' ? '#8BC34A' : '#FFC107'
  const modeDim = captureMode === 'good' ? '#8BC34A33' : '#FFC10733'

  return (
    <div className="min-h-full h-full bg-gray-900 text-white p-8 flex flex-col font-sans relative">
      <header className="mb-8 text-center animate-fade-in-down relative">
        <h1 className="text-3xl font-extrabold text-[#4CAF50] tracking-tight flex items-center justify-center gap-2">
          AI 모델 맞춤 학습 <img src={logo} alt="꼬북이" className="w-12 h-12" />
        </h1>
        <p className="text-gray-400 mt-3 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          더욱 정확한 거북목 감지를 위해 회원님의 평소 자세를 학습합니다.
          <br />
          버튼을 누르면 <strong>5초 후</strong> 데이터 추출이 시작되고{' '}
          <strong>1분 간 자세를 유지</strong>해 주세요!
        </p>

        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          {!mpReady && !mpError && (
            <span className="text-yellow-400 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              로딩 중...
            </span>
          )}
          {mpReady && <span className="text-green-400">● 준비 완료</span>}
          {mpError && <span className="text-red-400">⚠ {mpError}</span>}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full">
        <div className="relative w-full max-w-3xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-800">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
              <Camera size={72} strokeWidth={1.5} className="mb-4 opacity-50" />
              <span className="text-sm font-medium tracking-widest">WEBCAM PREVIEW</span>
            </div>
          )}

          {capturePhase === 'prepare' && (
            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
              <div
                className="text-xs font-bold px-3 py-1 rounded-full border"
                style={{
                  color: modeColor,
                  backgroundColor: modeDim,
                  borderColor: modeColor + '66'
                }}
              >
                {modeLabel} 촬영
              </div>
              <p className="text-white text-base font-semibold">잠시 후 데이터 추출이 시작됩니다</p>
              <p className="text-gray-300 text-sm -mt-1">자세를 잡고 준비해 주세요</p>
              <div
                className="text-[7rem] font-black leading-none mt-2"
                style={{ color: modeColor }}
              >
                {countdown}
              </div>
              <p className="text-gray-400 text-sm">초 후 시작</p>
            </div>
          )}

          {capturePhase === 'collecting' && (
            <>
              <div className="absolute top-5 right-5 flex flex-col items-end gap-2 pointer-events-none">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg"
                  style={{
                    backgroundColor: modeColor + 'DD',
                    color: captureMode === 'good' ? 'white' : '#1a1a1a'
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {modeLabel} 수집 중
                </div>
                <div className="text-xs text-white bg-black/60 px-2.5 py-1 rounded-lg">
                  {elapsedSec} / {COLLECT_SECONDS}초 &nbsp;·&nbsp; {frameCount} 프레임
                </div>
              </div>

              <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
                <div className="flex justify-between text-xs text-gray-300 mb-1 px-0.5">
                  <span>수집 진행률</span>
                  <span>{Math.round((elapsedSec / COLLECT_SECONDS) * 100)}%</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{
                      width: `${(elapsedSec / COLLECT_SECONDS) * 100}%`,
                      backgroundColor: modeColor
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {capturePhase === 'done' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-white font-bold text-lg">{modeLabel} 수집 완료!</p>
                <p className="text-gray-300 text-sm mt-1">{frameCount}개 프레임 저장됨</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex gap-6 w-full max-w-2xl px-4">
          <button
            onClick={() => handleCapture('good')}
            disabled={!mpReady || isCapturing || isTraining || isComplete}
            className={`flex-1 bg-gray-800 hover:bg-gray-700 rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-1 shadow-md border disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
              capturedGood ? 'border-[#8BC34A] scale-[1.02] shadow-lg' : 'border-transparent'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#8BC34A]/10 text-[#8BC34A] flex items-center justify-center">
                <CheckCircle size={32} />
              </div>
              <div className="text-center">
                <div className="font-extrabold text-white text-lg">
                  바른 자세 촬영{' '}
                  {capturedGood && <span className="text-[#8BC34A] text-sm ml-1">✓ 완료</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1.5 font-medium">
                  허리를 펴고 모니터 정면을
                  <br />
                  바라보세요 &nbsp;
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleCapture('bad')}
            disabled={!mpReady || isCapturing || isTraining || isComplete}
            className={`flex-1 bg-gray-800 hover:bg-gray-700 rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-1 shadow-md border disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
              capturedBad ? 'border-[#FFC107] scale-[1.02] shadow-lg' : 'border-transparent'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FFC107]/10 text-[#FFC107] flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div className="text-center">
                <div className="font-extrabold text-white text-lg">
                  거북목 자세 촬영{' '}
                  {capturedBad && <span className="text-[#FFC107] text-sm ml-1">✓ 완료</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1.5 font-medium">
                  평소 모니터에 집중한
                  <br />
                  굽은 자세 &nbsp;
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {!isComplete ? (
            <button
              onClick={handleRequestTraining}
              disabled={!bothCaptured || isTraining || isCapturing}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all ${
                bothCaptured && !isTraining && !isCapturing
                  ? 'bg-[#4CAF50] hover:bg-[#43A047] text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isTraining ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  서버 학습 중...
                </>
              ) : (
                <>
                  서버에 학습 요청 <ArrowRight size={18} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-full font-bold shadow-lg transition-all"
            >
              학습 완료! 메인으로 가기 <ArrowRight size={18} />
            </button>
          )}

          {import.meta.env.DEV && (
            <button
              onClick={() => navigate('/main')}
              className="text-xs text-gray-600 hover:text-gray-400 underline transition-colors"
              title="[DEV] 학습 건너뛰기"
            >
              [DEV] 건너뛰기
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
