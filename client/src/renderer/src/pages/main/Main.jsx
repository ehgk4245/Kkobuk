import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Settings,
  Camera,
  Play,
  Square,
  Pause,
  PictureInPicture2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  BarChart2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWebcam } from '../../context/WebcamContext'
import { aiFetch, apiFetch, getValidToken } from '../../utils/api'
import { useMediaPipe } from '../../hooks/useMediaPipe'
import { useAudioAlert } from '../../hooks/useAudioAlert'
import { usePostureSession } from '../../hooks/usePostureSession'
import BaselineOverlay from './components/BaselineOverlay'
import MiniModeView from './components/MiniModeView'
import SessionSummary from './components/SessionSummary'

const POSE_IDX = { leftShoulder: 11, rightShoulder: 12 }
const FACE_IDX = { nose: 4, leftEar: 234, rightEar: 454 }
const pickXYZ = ({ x, y, z }) => ({ x, y, z })

const PRE_COUNTDOWN_SECONDS = 3
const BASELINE_SECONDS = 5
const BASELINE_INTERVAL_MS = 200
const FRAME_INTERVAL_MS = 500
const AI_WS_URL = import.meta.env.VITE_AI_WS_URL

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
  const [hasActiveModel, setHasActiveModel] = useState(null)

  const wsRef = useRef(null)
  const animFrameRef = useRef(null)
  const landmarkHandlerRef = useRef(null)
  const isRecalibrationRef = useRef(false)

  const { poseLandmarkerRef, faceLandmarkerRef, mpReady } = useMediaPipe()
  const { sessionGoodSec, sessionBadSec, goodSecRef, badSecRef, sessionSavedRef, reset: resetSession } =
    usePostureSession(isGoodPosture, trackingState)
  useAudioAlert(isGoodPosture, trackingState)

  // 활성 모델 존재 여부 확인
  useEffect(() => {
    aiFetch('/api/models')
      .then((r) => r.json())
      .then((models) => setHasActiveModel(models.some((m) => m.status === 'ACTIVE')))
      .catch(() => setHasActiveModel(false))
  }, [])

  // 비디오 스트림 연결
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream, isMiniMode])

  useEffect(() => {
    if (miniVideoRef.current && stream) miniVideoRef.current.srcObject = stream
  }, [stream, isMiniMode])

  // MediaPipe rAF 루프
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
  }, [mpReady, poseLandmarkerRef, faceLandmarkerRef])

  // 언마운트 / 앱 종료 시 세션 저장
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
      flushSession()
    }
  }, [goodSecRef, badSecRef, sessionSavedRef])

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
    resetSession()

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
  }, [mpReady, closeWs, startFrameStreaming, resetSession])

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
          body: JSON.stringify({ totalDurationSec: total, goodPostureSec: good, badPostureSec: bad })
        })
      } catch (e) {
        console.warn('[handleStop] 세션 저장 실패:', e)
      }
    }
  }, [closeWs, goodSecRef, badSecRef, sessionSavedRef])

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

  const handleBaselineStart = useCallback(() => {
    const recal = isRecalibrationRef.current
    isRecalibrationRef.current = false
    startBaselineCollection(recal)
  }, [startBaselineCollection])

  const isTracking = trackingState !== 'idle' && trackingState !== 'connecting'
  const isPaused = trackingState === 'paused'
  const isConnecting = trackingState === 'connecting'
  const isLiveTracking = trackingState === 'tracking'
  const isMeasuring = trackingState === 'baseline_collecting' || trackingState === 'recalibrating'
  const showBaselineOverlay =
    trackingState === 'baseline_prompt' ||
    trackingState === 'baseline_pre' ||
    trackingState === 'recalibrating_pre'

  if (isMiniMode) {
    return (
      <MiniModeView
        stream={stream}
        videoRef={miniVideoRef}
        trackingState={trackingState}
        isGoodPosture={isGoodPosture}
        postureProba={postureProba}
        countdown={countdown}
        wsError={wsError}
        mpReady={mpReady}
        onStart={handleStartTracking}
        onStop={handleStop}
        onPause={handlePause}
        onResume={handleResume}
        onToggleMini={toggleMiniMode}
      />
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

          {showBaselineOverlay && (
            <BaselineOverlay
              trackingState={trackingState}
              countdown={countdown}
              onStart={handleBaselineStart}
            />
          )}
        </div>

        {wsError && <p className="mt-3 text-red-400 text-sm text-center">{wsError}</p>}

        {isTracking && <SessionSummary sessionGoodSec={sessionGoodSec} sessionBadSec={sessionBadSec} />}

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
