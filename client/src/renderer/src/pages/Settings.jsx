import { ArrowLeft, Bell, Database, Repeat, User, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const navigate = useNavigate()

  const [volume, setVolume] = useState(80)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken')
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    } catch {} // eslint-disable-line no-empty
    finally {
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
          <div className="flex items-center gap-3 mb-5 text-[#4CAF50]">
            <Database size={22} className="text-[#8BC34A]" />
            <h2 className="text-lg font-bold text-white">학습 모델 설정</h2>
          </div>

          <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-2xl mb-4">
            <div>
              <p className="font-bold text-sm text-gray-200">현재 학습 상태</p>
              <p className="text-xs text-[#4CAF50] font-medium mt-0.5">최적화 완료됨</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>

          <button
            onClick={() => navigate('/training')}
            className="w-full py-3.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 text-gray-200 transition"
          >
            <Repeat size={18} /> 새롭게 다시 학습하기
          </button>
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
