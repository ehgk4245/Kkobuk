import PropTypes from 'prop-types'
import { Bell, Volume2, Timer, Activity } from 'lucide-react'

export default function NotificationSection({
  soundEnabled, onSoundEnabledChange,
  volume, onVolumeChange,
  soundInterval, onSoundIntervalChange,
  badThreshold, onBadThresholdChange
}) {
  return (
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
            onClick={() => onSoundEnabledChange(!soundEnabled)}
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
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#8BC34A]"
            />
            <span className="text-xs text-gray-400">100</span>
          </div>
        </div>

        <div className="flex flex-col p-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-orange-900/30 text-orange-500 rounded-xl">
              <Timer size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-100">알림 주기</p>
              <p className="text-xs text-gray-500 mt-1">거북목 지속 시 경고음 간격</p>
            </div>
            <div className="flex-1 text-right">
              <span className="text-sm font-bold text-[#8BC34A]">{soundInterval}초</span>
            </div>
          </div>
          <div className="flex items-center gap-4 pl-14 pr-2">
            <span className="text-xs text-gray-400">3s</span>
            <input
              type="range"
              min="3"
              max="60"
              value={soundInterval}
              onChange={(e) => onSoundIntervalChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#8BC34A]"
            />
            <span className="text-xs text-gray-400">60s</span>
          </div>
        </div>

        <div className="flex flex-col p-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-yellow-900/30 text-yellow-500 rounded-xl">
              <Activity size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-100">거북목 판정 기준</p>
              <p className="text-xs text-gray-500 mt-1">이 확률 이상이면 거북목으로 판정</p>
            </div>
            <div className="flex-1 text-right">
              <span className="text-sm font-bold text-[#8BC34A]">{badThreshold}%</span>
            </div>
          </div>
          <div className="flex items-center gap-4 pl-14 pr-2">
            <span className="text-xs text-gray-400">50%</span>
            <input
              type="range"
              min="50"
              max="90"
              value={badThreshold}
              onChange={(e) => onBadThresholdChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#8BC34A]"
            />
            <span className="text-xs text-gray-400">90%</span>
          </div>
        </div>
      </div>
    </section>
  )
}

NotificationSection.propTypes = {
  soundEnabled: PropTypes.bool.isRequired,
  onSoundEnabledChange: PropTypes.func.isRequired,
  volume: PropTypes.number.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
  soundInterval: PropTypes.number.isRequired,
  onSoundIntervalChange: PropTypes.func.isRequired,
  badThreshold: PropTypes.number.isRequired,
  onBadThresholdChange: PropTypes.func.isRequired
}
