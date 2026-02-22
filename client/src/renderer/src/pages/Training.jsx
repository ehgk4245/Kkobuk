import { useState } from 'react'
import { Camera, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logo from '../../../../resources/icon.png'

export default function Training() {
  const navigate = useNavigate()
  const [trainingMode, setTrainingMode] = useState(null)
  const [capturedGood, setCapturedGood] = useState(false)
  const [capturedBad, setCapturedBad] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const bothCaptured = capturedGood && capturedBad

  // TODO: 실제 서버 학습 API 연동
  const handleRequestTraining = () => {
    setIsTraining(true)
    setTimeout(() => {
      setIsTraining(false)
      setIsComplete(true)
    }, 3000)
  }

  const handleComplete = () => {
    localStorage.setItem('onboardingComplete', 'true')
    navigate('/main')
  }

  return (
    <div className="min-h-full h-full bg-gray-900 text-white p-8 flex flex-col font-sans relative">
      <header className="mb-8 text-center animate-fade-in-down relative">
        <h1 className="text-3xl font-extrabold text-[#4CAF50] tracking-tight flex items-center justify-center gap-2">
          AI 모델 맞춤 학습 <img src={logo} alt="꼬북이" className="w-12 h-12" />
        </h1>
        <p className="text-gray-400 mt-3 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          더욱 정확한 거북목 감지를 위해 회원님의 평소 자세를 학습합니다.
          <br />
          아래 가이드에 맞춰 버튼을 누르고 <strong>10초 간 자세를 유지</strong>해 주세요!
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center w-full">
        {/* 웹캠 뷰어 */}
        <div className="relative w-full max-w-3xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-800 group">
          {/* TODO: <video> 태그 연결 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
            <Camera
              size={72}
              strokeWidth={1.5}
              className="mb-4 opacity-50 block group-hover:scale-110 transition-transform"
            />
            <span className="text-sm font-medium tracking-widest">WEBCAM PREVIEW</span>
          </div>

          {trainingMode && (
            <div
              className={`absolute top-6 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full font-extrabold text-sm shadow-xl animate-bounce ${
                trainingMode === 'good' ? 'bg-[#8BC34A] text-white' : 'bg-[#FFC107] text-gray-900'
              }`}
            >
              {trainingMode === 'good'
                ? '✅ 바른 자세 촬영 중... (10s)'
                : '⚠️ 거북목 자세 촬영 중... (10s)'}
            </div>
          )}
        </div>

        {/* 촬영 버튼 */}
        <div className="mt-12 flex gap-6 w-full max-w-2xl px-4">
          <button
            onClick={() => {
              setTrainingMode('good')
              setCapturedGood(true)
            }}
            disabled={isTraining || isComplete}
            className={`flex-1 bg-gray-800 hover:bg-gray-700 rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-1 shadow-md border disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
              capturedGood ? 'border-[#8BC34A] scale-[1.02] shadow-lg' : 'border-transparent'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#8BC34A]/10 text-[#8BC34A] flex items-center justify-center transition-colors">
                <CheckCircle size={32} />
              </div>
              <div className="text-center">
                <div className="font-extrabold text-white text-lg">
                  바른 자세 촬영{' '}
                  {capturedGood && <span className="text-[#8BC34A] text-sm ml-1">✓ 완료</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1.5 font-medium">
                  허리를 펴고 모니터 정면을
                  <br />
                  바라보세요
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setTrainingMode('bad')
              setCapturedBad(true)
            }}
            disabled={isTraining || isComplete}
            className={`flex-1 bg-gray-800 hover:bg-gray-700 rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-1 shadow-md border disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
              capturedBad ? 'border-[#FFC107] scale-[1.02] shadow-lg' : 'border-transparent'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FFC107]/10 text-[#FFC107] flex items-center justify-center transition-colors">
                <AlertTriangle size={32} />
              </div>
              <div className="text-center">
                <div className="font-extrabold text-white text-lg">
                  거북목 자세 촬영{' '}
                  {capturedBad && <span className="text-[#FFC107] text-sm ml-1">✓ 완료</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1.5 font-medium">
                  평소 작업할 때의
                  <br />
                  모니터에 집중한 굽은 자세
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {!isComplete ? (
            <button
              onClick={handleRequestTraining}
              disabled={!bothCaptured || isTraining}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all ${
                bothCaptured && !isTraining
                  ? 'bg-[#4CAF50] hover:bg-[#43A047] text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isTraining ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  서버 학습 중...
                </>
              ) : (
                <>
                  서버에 학습 요청 <ArrowRight size={18} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-full font-bold shadow-lg transition-all"
            >
              학습 완료! 메인으로 가기 <ArrowRight size={18} />
            </button>
          )}

          {import.meta.env.DEV && (
            <button
              onClick={() => navigate('/main')}
              className="text-xs text-gray-600 hover:text-gray-400 underline transition-colors"
              title="[DEV] 학습 건너뛰기"
            >
              [DEV] 건너뛰기
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
