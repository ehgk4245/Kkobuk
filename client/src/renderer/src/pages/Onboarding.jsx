import { useState } from 'react'
import { Camera, Check, ArrowRight, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logo from '../../../../resources/icon.png'
import { useWebcam } from '../context/WebcamContext'

export default function Onboarding() {
  const navigate = useNavigate()
  const { permissionError, isRequesting, requestPermission } = useWebcam()
  const [permissionGranted, setPermissionGranted] = useState(false)

  const handleRequestCamera = async () => {
    const granted = await requestPermission()
    if (granted) {
      setPermissionGranted(true)
    }
  }

  return (
    <div className="min-h-full h-full bg-gray-900 flex justify-center items-center p-6 font-sans relative">
      <div className="w-full max-w-md bg-gray-800 rounded-[2.5rem] p-10 shadow-xl text-center border border-gray-700">
        <div className="text-6xl mb-6">📸</div>
        <h1 className="text-2xl font-extrabold text-white mb-3">웹캠 권한이 필요해요!</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Kkobuk은 사용자님의 자세를 실시간으로 분석하기 위해 데스크톱 웹캠 화면에 접근해야 합니다.
          <br />
          <strong>안심하세요!</strong> 영상은 기기 내에서만 처리되며 서버로 전송되지 않습니다.
        </p>

        <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-2xl p-4 mb-8 text-left flex gap-4">
          <img src={logo} alt="꼬북이" className="w-14 h-14 mt-1 shrink-0" />
          <div>
            <h3 className="font-bold text-[#4CAF50] mb-1">꼬북이의 똑똑한 가이드</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>1. 모니터와 눈높이를 수평으로 맞추세요.</li>
              <li>2. 밝은 곳에서 촬영하면 더 정확해요.</li>
              <li>3. 정면을 똑바로 바라봐주세요.</li>
            </ul>
          </div>
        </div>

        {permissionError && (
          <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-xl p-3 mb-4 text-left">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-300 text-sm">{permissionError}</p>
          </div>
        )}

        {!permissionGranted ? (
          <button
            onClick={handleRequestCamera}
            disabled={isRequesting}
            className="w-full flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#43A047] disabled:bg-[#4CAF50]/50 text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            {isRequesting ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                권한 요청 중...
              </>
            ) : (
              <>
                <Camera size={20} /> 카메라 권한 허용하기
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => navigate('/training')}
            className="w-full flex items-center justify-center gap-2 bg-[#8BC34A] hover:bg-[#7CB342] text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg animate-fade-in-up"
          >
            <Check size={20} /> 학습하러 가기 <ArrowRight size={20} className="ml-1" />
          </button>
        )}
      </div>
    </div>
  )
}
