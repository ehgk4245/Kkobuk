import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Database,
  Loader2,
  Repeat,
  User,
  Volume2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiFetch, apiFetch } from '../utils/api'

export default function Settings() {
  const navigate = useNavigate()

  const [volume, setVolume] = useState(80)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [activatingId, setActivatingId] = useState(null)

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
        <section className="bg-gray-800 rounded-[2rem] p-6 shadow-md border border-gray-700">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Database size={22} className="text-[#8BC34A]" />
              <h2 className="text-lg font-bold text-white">학습 모델 설정</h2>
            </div>
            <button
              onClick={() => navigate('/training')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-200 transition"
            >
              <Repeat size={14} /> 새로 학습
            </button>
          </div>

          {modelsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={24} className="animate-spin text-gray-500" />
            </div>
          ) : models.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">학습된 모델이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                    model.status === 'ACTIVE'
                      ? 'bg-[#8BC34A]/10 border-[#8BC34A]/40'
                      : 'bg-gray-900/50 border-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2">
                      {model.status === 'ACTIVE' && (
                        <CheckCircle2 size={14} className="text-[#8BC34A] shrink-0" />
                      )}
                      <p className="font-bold text-sm text-gray-100 truncate">
                        {model.name || '이름 없는 모델'}
                      </p>
                    </div>
                    {model.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{model.description}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5">
                      {model.createdAt ? new Date(model.createdAt).toLocaleDateString('ko-KR') : ''}
                    </p>
                  </div>
                  {model.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleActivate(model.id)}
                      disabled={activatingId !== null}
                      className="shrink-0 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-200 transition disabled:opacity-50"
                    >
                      {activatingId === model.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        '적용'
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-gray-800 rounded-[2rem] shadow-md border border-gray-700 overflow-hidden">
          <div className="divide-y-2 divide-gray-700">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-900/30 text-blue-500 rounded-xl">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-100">알림 소리</p>
                  <p className="text-xs text-gray-500 mt-1">거북목 경고음 발생</p>
                </div>
              </div>
              <div
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-14 h-8 rounded-full p-1 cursor-pointer flex transition-colors duration-200 ${soundEnabled ? 'bg-[#8BC34A] justify-end' : 'bg-gray-600 justify-start'}`}
              >
                <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>

            <div className="flex flex-col p-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-900/30 text-purple-500 rounded-xl">
                  <Volume2 size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-100">알림 음량</p>
                  <p className="text-xs text-gray-500 mt-1">경고음 크기 조절</p>
                </div>
                <div className="flex-1 text-right">
                  <span className="text-sm font-bold text-[#8BC34A]">{volume}%</span>
                </div>
              </div>
              <div className="flex items-center gap-4 pl-14 pr-2">
                <span className="text-xs text-gray-400">0</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#8BC34A]"
                />
                <span className="text-xs text-gray-400">100</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-800 rounded-[2rem] p-6 shadow-md border border-gray-700">
          <div className="flex items-center gap-3 mb-5 text-gray-500">
            <User size={22} className="text-gray-400" />
            <h2 className="text-lg font-bold text-white">계정 관리</h2>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-2 py-3 text-red-500 font-medium hover:bg-red-500/10 rounded-xl transition"
          >
            로그아웃
          </button>
        </section>
      </main>
    </div>
  )
}
