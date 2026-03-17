import { useRef, useState, useEffect, useCallback } from 'react'

export function usePostureSession(isGoodPosture, trackingState) {
  const goodSecRef = useRef(0)
  const badSecRef = useRef(0)
  const isGoodPostureRef = useRef(true)
  const sessionTimerRef = useRef(null)
  const sessionSavedRef = useRef(false)
  const [sessionGoodSec, setSessionGoodSec] = useState(0)
  const [sessionBadSec, setSessionBadSec] = useState(0)

  useEffect(() => {
    isGoodPostureRef.current = isGoodPosture
  }, [isGoodPosture])

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

  const reset = useCallback(() => {
    goodSecRef.current = 0
    badSecRef.current = 0
    sessionSavedRef.current = false
    setSessionGoodSec(0)
    setSessionBadSec(0)
  }, [])

  return { sessionGoodSec, sessionBadSec, goodSecRef, badSecRef, sessionSavedRef, reset }
}
