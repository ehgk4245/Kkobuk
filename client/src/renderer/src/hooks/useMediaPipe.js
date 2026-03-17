import { useState, useRef, useEffect } from 'react'
import { PoseLandmarker, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_URL = './mediapipe-wasm'
const POSE_MODEL_URL = './mediapipe-wasm/pose_landmarker_lite.task'
const FACE_MODEL_URL = './mediapipe-wasm/face_landmarker.task'

export function useMediaPipe() {
  const poseLandmarkerRef = useRef(null)
  const faceLandmarkerRef = useRef(null)
  const [mpReady, setMpReady] = useState(false)
  const [mpError, setMpError] = useState(null)

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
        if (!cancelled) setMpError('AI 모델 로드 실패: ' + err.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { poseLandmarkerRef, faceLandmarkerRef, mpReady, mpError }
}
