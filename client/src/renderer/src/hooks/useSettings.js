import { useState } from 'react'

export function useSettings() {
  const [soundEnabled, setSoundEnabledState] = useState(
    () => localStorage.getItem('kkobuk_soundEnabled') !== 'false'
  )
  const [volume, setVolumeState] = useState(
    () => Number(localStorage.getItem('kkobuk_soundVolume') ?? 80)
  )
  const [soundInterval, setSoundIntervalState] = useState(
    () => Number(localStorage.getItem('kkobuk_soundInterval') ?? 10)
  )
  const [badThreshold, setBadThresholdState] = useState(
    () => Number(localStorage.getItem('kkobuk_badPostureThreshold') ?? 70)
  )

  const setSoundEnabled = (v) => {
    setSoundEnabledState(v)
    localStorage.setItem('kkobuk_soundEnabled', String(v))
  }
  const setVolume = (v) => {
    setVolumeState(v)
    localStorage.setItem('kkobuk_soundVolume', String(v))
  }
  const setSoundInterval = (v) => {
    setSoundIntervalState(v)
    localStorage.setItem('kkobuk_soundInterval', String(v))
  }
  const setBadThreshold = (v) => {
    setBadThresholdState(v)
    localStorage.setItem('kkobuk_badPostureThreshold', String(v))
  }

  return {
    soundEnabled, setSoundEnabled,
    volume, setVolume,
    soundInterval, setSoundInterval,
    badThreshold, setBadThreshold
  }
}
