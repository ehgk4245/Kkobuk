import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { apiFetch } from '../../utils/api'
import { useSettings } from '../../hooks/useSettings'
import { useModels } from '../../hooks/useModels'
import ModelSection from './components/ModelSection'
import NotificationSection from './components/NotificationSection'
import AccountSection from './components/AccountSection'

export default function Settings() {
  const navigate = useNavigate()
  const {
    soundEnabled, setSoundEnabled,
    volume, setVolume,
    soundInterval, setSoundInterval,
    badThreshold, setBadThreshold
  } = useSettings()
  const { models, modelsLoading, activatingId, deletingId, handleActivate, handleDelete } = useModels()

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
    } finally {
      // eslint-disable-line no-empty
      localStorage.clear()
      navigate('/')
    }
  }

  return (
    <div className="min-h-full h-full bg-gray-900 text-gray-100 p-6 flex flex-col font-sans">
      <header className="flex items-center mb-8 relative">
        <button
          onClick={() => navigate('/main')}
          className="p-3 bg-gray-800 rounded-full shadow-sm hover:shadow-md hover:bg-gray-700 transition"
        >
          <ArrowLeft size={20} className="text-gray-300" />
        </button>
        <h1 className="text-2xl font-extrabold text-center flex-1 pr-12 text-white">환경 설정</h1>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto space-y-6">
        <ModelSection
          models={models}
          modelsLoading={modelsLoading}
          activatingId={activatingId}
          deletingId={deletingId}
          onActivate={handleActivate}
          onDelete={handleDelete}
        />
        <NotificationSection
          soundEnabled={soundEnabled}
          onSoundEnabledChange={setSoundEnabled}
          volume={volume}
          onVolumeChange={setVolume}
          soundInterval={soundInterval}
          onSoundIntervalChange={setSoundInterval}
          badThreshold={badThreshold}
          onBadThresholdChange={setBadThreshold}
        />
        <AccountSection onLogout={handleLogout} />
      </main>
    </div>
  )
}
