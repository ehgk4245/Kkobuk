import { useRef, useCallback, useEffect } from 'react'

export function useAudioAlert(isGoodPosture, trackingState) {
  const audioCtxRef = useRef(null)
  const soundIntervalTimerRef = useRef(null)

  const playNotificationSound = useCallback((volume) => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      ctx.resume().then(() => {
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
      })
    } catch {} // eslint-disable-line no-empty
  }, [])

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
  }, [isGoodPosture, trackingState, playNotificationSound])
}
