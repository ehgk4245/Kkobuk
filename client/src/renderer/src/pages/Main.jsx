import { useState, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Settings,
  Camera,
  Play,
  Square,
  Pause,
  Maximize,
  PictureInPicture2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  BarChart2
} from 'lucide-react'
import { PoseLandmarker, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { useNavigate } from 'react-router-dom'
import { useWebcam } from '../context/WebcamContext'
import { aiFetch, apiFetch, getValidToken } from '../utils/api'

const POSE_IDX = { leftShoulder: 11, rightShoulder: 12 }
const FACE_IDX = { nose: 4, leftEar: 234, rightEar: 454 }
const pickXYZ = ({ x, y, z }) => ({ x, y, z })

const WASM_URL = './mediapipe-wasm'
const POSE_MODEL_URL = './mediapipe-wasm/pose_landmarker_lite.task'
const FACE_MODEL_URL = './mediapipe-wasm/face_landmarker.task'

function formatDuration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

const PRE_COUNTDOWN_SECONDS = 3
const BASELINE_SECONDS = 5
const BASELINE_INTERVAL_MS = 200
const FRAME_INTERVAL_MS = 500
const AI_WS_URL = import.meta.env.VITE_AI_WS_URL

function playNotificationSound(volume) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(volume * 0.8, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
    osc.onended = () => ctx.close()
  } catch {} // eslint-disable-line no-empty
}

// trackingState:
// 'idle' | 'connecting' | 'baseline_prompt'
// | 'baseline_pre' | 'baseline_collecting'
// | 'tracking' | 'paused'
// | 'recalibrating_pre' | 'recalibrating'

function BaselineOverlay({ mini = false, trackingState, countdown, onStart }) {
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

export default function Main() {
  const navigate = useNavigate()
  const { stream, permissionError, requestPermission, isRequesting } = useWebcam()
  const videoRef = useRef(null)
  const miniVideoRef = useRef(null)
  const [isMiniMode, setIsMiniMode] = useState(false)

  const [trackingState, setTrackingState] = useState('idle')
  const [isGoodPosture, setIsGoodPosture] = useState(true)
  const [postureProba, setPostureProba] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [wsError, setWsError] = useState(null)
  const [mpReady, setMpReady] = useState(false)
  const [hasActiveModel, setHasActiveModel] = useState(null)

  const wsRef = useRef(null)
  const poseLandmarkerRef = useRef(null)
  const faceLandmarkerRef = useRef(null)
  const animFrameRef = useRef(null)
  const landmarkHandlerRef = useRef(null)
  const isRecalibrationRef = useRef(false)
  const soundIntervalTimerRef = useRef(null)

  // 세션 누적 카운터
  const goodSecRef = useRef(0)
  const badSecRef = useRef(0)
  const isGoodPostureRef = useRef(true)
  const sessionTimerRef = useRef(null)
  const sessionSavedRef = useRef(false) // 중복 저장 방지
  const [sessionGoodSec, setSessionGoodSec] = useState(0)
  const [sessionBadSec, setSessionBadSec] = useState(0)

  // 활성 모델 존재 여부 확인
  useEffect(() => {
    aiFetch('/api/models')
      .then((r) => r.json())
      .then((models) => setHasActiveModel(models.some((m) => m.status === 'ACTIVE')))
      .catch(() => setHasActiveModel(false))
  }, [])

  // MediaPipe 초기화
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)
        const [pose, face] = await Promise.all([
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numPoses: 1
          }),
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numFaces: 1
          })
        ])
        if (!cancelled) {
          poseLandmarkerRef.current = pose
          faceLandmarkerRef.current = face
          setMpReady(true)
        }
      } catch (err) {
        console.error('[MediaPipe] 초기화 실패:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 비디오 스트림 연결
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream, isMiniMode])

  useEffect(() => {
    if (miniVideoRef.current && stream) miniVideoRef.current.srcObject = stream
  }, [stream, isMiniMode])

  // MediaPipe rAF 루프 (mpReady 되면 계속 실행, landmarkHandlerRef에 핸들러 있을 때만 처리)
  useEffect(() => {
    if (!mpReady) return

    const loop = () => {
      if (landmarkHandlerRef.current) {
        const video = videoRef.current ?? miniVideoRef.current
        const pose = poseLandmarkerRef.current
        const face = faceLandmarkerRef.current
        if (video && pose && face && video.readyState >= 2) {
          const now = performance.now()
          try {
            const poseResults = pose.detectForVideo(video, now)
            const faceResults = face.detectForVideo(video, now)
            const posePts = poseResults.landmarks?.[0]
            const facePts = faceResults.faceLandmarks?.[0]
            if (posePts && facePts) {
              const landmarks = {
                nose: pickXYZ(facePts[FACE_IDX.nose]),
                leftEar: pickXYZ(facePts[FACE_IDX.leftEar]),
                rightEar: pickXYZ(facePts[FACE_IDX.rightEar]),
                leftShoulder: pickXYZ(posePts[POSE_IDX.leftShoulder]),
                rightShoulder: pickXYZ(posePts[POSE_IDX.rightShoulder])
              }
              landmarkHandlerRef.current(landmarks, now)
            }
          } catch {} // eslint-disable-line no-empty
        }
      }
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [mpReady])

  // 거북목 지속 시 주기적 알림음
  useEffect(() => {
    if (soundIntervalTimerRef.current) {
      clearInterval(soundIntervalTimerRef.current)
      soundIntervalTimerRef.current = null
    }
    if (!isGoodPosture && trackingState === 'tracking') {
      if (localStorage.getItem('kkobuk_soundEnabled') === 'false') return
      const volume = Number(localStorage.getItem('kkobuk_soundVolume') ?? 80) / 100
      const intervalSec = Number(localStorage.getItem('kkobuk_soundInterval') ?? 10)
      playNotificationSound(volume)
      soundIntervalTimerRef.current = setInterval(() => {
        playNotificationSound(volume)
      }, intervalSec * 1000)
    }
    return () => {
      if (soundIntervalTimerRef.current) {
        clearInterval(soundIntervalTimerRef.current)
        soundIntervalTimerRef.current = null
      }
    }
  }, [isGoodPosture, trackingState])

  // isGoodPosture → ref 동기화 (interval closure 안에서 읽기 위해)
  useEffect(() => {
    isGoodPostureRef.current = isGoodPosture
  }, [isGoodPosture])

  // 트래킹 중 1초마다 good/bad 초 누적
  useEffect(() => {
    if (trackingState === 'tracking') {
      sessionTimerRef.current = setInterval(() => {
        if (isGoodPostureRef.current) {
          goodSecRef.current += 1
          setSessionGoodSec(goodSecRef.current)
        } else {
          badSecRef.current += 1
          setSessionBadSec(badSecRef.current)
        }
      }, 1000)
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
    }
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
    }
  }, [trackingState])

  // 언마운트 / 앱 종료 시 세션 저장 (중복 방지: sessionSavedRef)
  useEffect(() => {
    const flushSession = () => {
      const good = goodSecRef.current
      const bad = badSecRef.current
      const total = good + bad
      if (total === 0 || sessionSavedRef.current) return
      sessionSavedRef.current = true
      const token = localStorage.getItem('accessToken')
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posture/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ totalDurationSec: total, goodPostureSec: good, badPostureSec: bad }),
        keepalive: true
      }).catch(() => {})
    }

    window.addEventListener('beforeunload', flushSession)
    return () => {
      window.removeEventListener('beforeunload', flushSession)
      wsRef.current?.close()
      flushSession() // 페이지 이동(unmount) 시
    }
  }, [])

  const closeWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const startFrameStreaming = useCallback(() => {
    setTrackingState('tracking')
    let lastFrameTime = 0
    landmarkHandlerRef.current = (landmarks, now) => {
      if (now - lastFrameTime >= FRAME_INTERVAL_MS) {
        wsRef.current?.send(JSON.stringify({ type: 'frame', landmarks }))
        lastFrameTime = now
      }
    }
  }, [])

  const startBaselineCollection = useCallback((isRecalibration = false) => {
    const preState = isRecalibration ? 'recalibrating_pre' : 'baseline_pre'
    const collectState = isRecalibration ? 'recalibrating' : 'baseline_collecting'

    setTrackingState(preState)
    setCountdown(PRE_COUNTDOWN_SECONDS)

    let preRemaining = PRE_COUNTDOWN_SECONDS
    const preTimer = setInterval(() => {
      preRemaining -= 1
      if (preRemaining > 0) {
        setCountdown(preRemaining)
      } else {
        clearInterval(preTimer)
        setTrackingState(collectState)
        setCountdown(BASELINE_SECONDS)

        const samples = []
        let lastSampleTime = 0
        const startTime = performance.now()

        let remaining = BASELINE_SECONDS
        const collectTimer = setInterval(() => {
          remaining -= 1
          if (remaining > 0) setCountdown(remaining)
          else clearInterval(collectTimer)
        }, 1000)

        landmarkHandlerRef.current = (landmarks, now) => {
          const elapsed = now - startTime
          if (elapsed >= BASELINE_SECONDS * 1000) {
            landmarkHandlerRef.current = null
            clearInterval(collectTimer)
            setCountdown(0)
            wsRef.current?.send(JSON.stringify({ type: 'baseline', samples }))
            return
          }
          if (now - lastSampleTime >= BASELINE_INTERVAL_MS) {
            samples.push(landmarks)
            lastSampleTime = now
          }
        }
      }
    }, 1000)
  }, [])

  const handleStartTracking = useCallback(async () => {
    if (!mpReady) return
    setWsError(null)
    setTrackingState('connecting')
    // 세션 카운터 초기화
    goodSecRef.current = 0
    badSecRef.current = 0
    sessionSavedRef.current = false
    setSessionGoodSec(0)
    setSessionBadSec(0)

    let token
    try {
      token = await getValidToken()
    } catch (e) {
      setWsError(e.message)
      setTrackingState('idle')
      return
    }

    const ws = new WebSocket(`${AI_WS_URL}/ws/posture?token=${encodeURIComponent(token)}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      switch (msg.type) {
        case 'connected':
          setTrackingState('baseline_prompt')
          break
        case 'ready':
          startFrameStreaming()
          break
        case 'result': {
          const badProba = msg.label === 'bad' ? msg.confidence : 1 - msg.confidence
          setPostureProba(badProba)
          const threshold = Number(localStorage.getItem('kkobuk_badPostureThreshold') ?? 70) / 100
          setIsGoodPosture(badProba < threshold)
          break
        }
        case 'error':
          setWsError(msg.message)
          closeWs()
          setTrackingState('idle')
          landmarkHandlerRef.current = null
          break
      }
    }

    ws.onerror = () => {
      setWsError('AI 서버 연결에 실패했습니다.')
      setTrackingState('idle')
      landmarkHandlerRef.current = null
      wsRef.current = null
    }

    ws.onclose = () => {
      setTrackingState('idle')
      landmarkHandlerRef.current = null
      wsRef.current = null
    }
  }, [mpReady, closeWs, startFrameStreaming])

  const handleStop = useCallback(async () => {
    const good = goodSecRef.current
    const bad = badSecRef.current
    const total = good + bad

    closeWs()
    landmarkHandlerRef.current = null
    setTrackingState('idle')
    setPostureProba(null)

    if (total > 0) {
      sessionSavedRef.current = true
      try {
        await apiFetch('/api/posture/sessions', {
          method: 'POST',
          body: JSON.stringify({
            totalDurationSec: total,
            goodPostureSec: good,
            badPostureSec: bad
          })
        })
      } catch (e) {
        console.warn('[handleStop] 세션 저장 실패:', e)
      }
    }
  }, [closeWs])

  const handlePause = useCallback(() => {
    landmarkHandlerRef.current = null
    setTrackingState('paused')
  }, [])

  const handleResume = useCallback(() => {
    startFrameStreaming()
  }, [startFrameStreaming])

  const handleRecalibrate = useCallback(() => {
    landmarkHandlerRef.current = null
    isRecalibrationRef.current = true
    setTrackingState('baseline_prompt')
  }, [])

  const toggleMiniMode = () => {
    if (isMiniMode) {
      window.api?.windowControl?.setNormalMode()
      setIsMiniMode(false)
    } else {
      window.api?.windowControl?.setMiniMode()
      setIsMiniMode(true)
    }
  }

  const isTracking = trackingState !== 'idle' && trackingState !== 'connecting'
  const isPaused = trackingState === 'paused'
  const isConnecting = trackingState === 'connecting'
  const showBaselineOverlay =
    trackingState === 'baseline_prompt' ||
    trackingState === 'baseline_pre' ||
    trackingState === 'recalibrating_pre'
  const isMeasuring = trackingState === 'baseline_collecting' || trackingState === 'recalibrating'
  const isLiveTracking = trackingState === 'tracking'
  const baselineOverlayProps = {
    trackingState,
    countdown,
    onStart: () => {
      const recal = isRecalibrationRef.current
      isRecalibrationRef.current = false
      startBaselineCollection(recal)
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
          {stream && (
            <video
              ref={miniVideoRef}
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
                onClick={toggleMiniMode}
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
              onClick={handleStartTracking}
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
                onClick={handleStop}
                className="p-4 bg-gray-700 border border-gray-600 hover:bg-gray-600 rounded-2xl text-red-400 shadow-md transition-transform hover:-translate-y-1"
              >
                <Square fill="currentColor" size={18} />
              </button>
              {(isLiveTracking || isPaused) && (
                <button
                  onClick={isPaused ? handleResume : handlePause}
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
            onClick={() => navigate('/stats')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 rounded-2xl shadow-sm hover:bg-gray-700 transition border border-gray-700 hover:border-gray-600"
            title="주간 통계"
          >
            <BarChart2 size={18} className="text-[#8BC34A]" />
            <span className="text-sm font-bold text-gray-200">통계</span>
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

          {(!isTracking || isPaused) && !showBaselineOverlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {!stream && !isTracking ? (
                <>
                  <Camera size={48} strokeWidth={1.5} className="mb-4 text-gray-600" />
                  {permissionError ? (
                    <p className="text-red-400 text-xs text-center mb-3 px-6">{permissionError}</p>
                  ) : (
                    <p className="text-gray-600 text-xs mb-3">카메라 권한이 필요합니다</p>
                  )}
                  <button
                    onClick={requestPermission}
                    disabled={isRequesting}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {isRequesting ? '권한 요청 중...' : '카메라 권한 허용하기'}
                  </button>
                </>
              ) : (
                <span className="text-sm font-bold tracking-widest text-gray-700 opacity-20">
                  {isConnecting ? 'CONNECTING...' : isPaused ? 'PAUSED' : 'CAMERA OFF'}
                </span>
              )}
            </div>
          )}

          {isLiveTracking && (
            <div className="absolute bottom-8 left-0 w-full flex flex-col items-center z-10">
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
              {postureProba !== null && (
                <div className="mt-2 px-4 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs font-bold text-gray-200">
                  거북목 확률 {Math.round(postureProba * 100)}%
                </div>
              )}
            </div>
          )}

          {isPaused && (
            <div className="absolute bottom-8 left-0 w-full flex justify-center z-10">
              <div className="px-8 py-3 rounded-full font-extrabold text-lg shadow-xl backdrop-blur-md bg-blue-600/90 text-white">
                ⏸ 일시정지
              </div>
            </div>
          )}

          {isMeasuring && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-5 py-2.5 rounded-full">
              <span className="text-white text-sm font-bold">측정 중</span>
              {countdown > 0 ? (
                <span className="text-[#8BC34A] font-extrabold text-xl w-6 text-center">
                  {countdown}
                </span>
              ) : (
                <Loader2 size={16} className="text-gray-300 animate-spin" />
              )}
            </div>
          )}

          {showBaselineOverlay && <BaselineOverlay {...baselineOverlayProps} />}
        </div>

        {wsError && <p className="mt-3 text-red-400 text-sm text-center">{wsError}</p>}

        {isTracking && sessionGoodSec + sessionBadSec > 0 && (
          <div className="mt-4 w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 flex items-center gap-4">
            <span className="text-xs text-gray-500 shrink-0">현재 세션</span>
            <div className="flex flex-1 justify-around">
              <div className="text-center">
                <p className="text-[10px] text-gray-500">바른 자세</p>
                <p className="text-sm font-extrabold text-[#8BC34A]">
                  {formatDuration(sessionGoodSec)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500">거북목</p>
                <p className="text-sm font-extrabold text-[#FFC107]">
                  {formatDuration(sessionBadSec)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500">바른 자세율</p>
                <p className="text-sm font-extrabold text-white">
                  {Math.round((sessionGoodSec / (sessionGoodSec + sessionBadSec)) * 100)}%
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-4 w-full max-w-md">
          {hasActiveModel === false ? (
            <div className="flex-1 flex flex-col items-center gap-3 py-4 bg-gray-800 border border-yellow-600/40 rounded-2xl">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle size={18} />
                <span className="font-bold text-sm">활성 모델이 없습니다</span>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold rounded-xl transition"
              >
                설정에서 모델 활성화하기
              </button>
            </div>
          ) : !isTracking && !isConnecting ? (
            <button
              onClick={handleStartTracking}
              disabled={!mpReady}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#8BC34A] hover:bg-[#7CB342] text-white rounded-2xl font-extrabold shadow-lg transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Play size={20} fill="currentColor" />
              {mpReady ? '판별 시작하기' : 'AI 모델 로딩 중...'}
            </button>
          ) : isConnecting ? (
            <div className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-700 text-gray-400 rounded-2xl font-extrabold shadow-lg">
              <Loader2 size={20} className="animate-spin" />
              서버 연결 중...
            </div>
          ) : (
            <>
              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-red-400 rounded-2xl font-extrabold shadow-md transition-all hover:-translate-y-1 hover:text-red-300"
              >
                <Square size={18} fill="currentColor" /> 중지하기
              </button>
              {isLiveTracking && (
                <button
                  onClick={handleRecalibrate}
                  title="베이스라인 재측정"
                  className="flex-none flex items-center justify-center w-14 py-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-400 rounded-2xl shadow-md transition-all hover:-translate-y-1"
                >
                  <RefreshCw size={18} />
                </button>
              )}
              {(isLiveTracking || isPaused) && (
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
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
