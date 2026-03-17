import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function toDateLabel(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_LABELS[d.getDay()]})`
}

function toShortLabel(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function buildWeekSlots() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export function useWeeklyStats() {
  const [weekData, setWeekData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/posture/sessions/weekly')
      .then((r) => r.json())
      .then((data) => {
        const slots = buildWeekSlots()
        const filled = slots.map((dateStr) => {
          const found = data.find((x) => x.sessionDate === dateStr)
          return {
            date: dateStr,
            label: toDateLabel(dateStr),
            shortLabel: toShortLabel(dateStr),
            totalDurationSec: found?.totalDurationSec ?? 0,
            goodPostureSec: found?.goodPostureSec ?? 0,
            badPostureSec: found?.badPostureSec ?? 0
          }
        })
        setWeekData(filled)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { weekData, loading }
}
