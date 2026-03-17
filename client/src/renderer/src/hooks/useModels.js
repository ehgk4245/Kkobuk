import { useState, useEffect } from 'react'
import { aiFetch } from '../utils/api'

export function useModels() {
  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [activatingId, setActivatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    aiFetch('/api/models')
      .then((r) => r.json())
      .then(setModels)
      .catch(() => {})
      .finally(() => setModelsLoading(false))
  }, [])

  const handleActivate = async (modelId) => {
    setActivatingId(modelId)
    try {
      const res = await aiFetch(`/api/models/${modelId}/activate`, { method: 'PUT' })
      if (res.ok) {
        setModels((prev) =>
          prev.map((m) => ({ ...m, status: m.id === modelId ? 'ACTIVE' : 'INACTIVE' }))
        )
      }
    } catch {
    } finally {
      setActivatingId(null)
    }
  }

  const handleDelete = async (modelId) => {
    setDeletingId(modelId)
    try {
      const res = await aiFetch(`/api/models/${modelId}`, { method: 'DELETE' })
      if (res.ok) {
        setModels((prev) => prev.filter((m) => m.id !== modelId))
      }
    } catch {
    } finally {
      setDeletingId(null)
    }
  }

  return { models, modelsLoading, activatingId, deletingId, handleActivate, handleDelete }
}
