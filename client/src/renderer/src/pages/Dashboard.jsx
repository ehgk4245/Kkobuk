import React from 'react';
import { ArrowLeft, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full h-full bg-gray-900 text-gray-100 p-6 flex flex-col font-sans">
      {/* 헤더 네비게이션 */}
      <header className="flex items-center mb-8 relative">
        <button 
          onClick={() => navigate('/main')}
          className="p-3 bg-gray-800 rounded-full shadow-sm hover:shadow-md hover:bg-gray-700 transition"
        >
          <ArrowLeft size={20} className="text-gray-300" />
        </button>
        <h1 className="text-2xl font-extrabold text-center flex-1 pr-12 text-white">통계 대시보드</h1>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto flex flex-col gap-6">
        
        {/* 전체 요약 카드 */}
        <div className="bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl"></div>
          <h2 className="text-sm font-bold opacity-90 mb-1">이번 주 목표 달성률</h2>
          <div className="text-5xl font-extrabold mb-4 flex items-end gap-2">
            85<span className="text-2xl opacity-75">%</span>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
              <span className="text-xs font-medium block opacity-90">바른 자세 유지</span>
              <span className="text-lg font-bold">14시간 20분</span>
            </div>
          </div>
        </div>

        {/* 상세 통계 뷰 */}
        <div className="bg-gray-800 rounded-[2rem] p-6 shadow-md border border-gray-700">
          <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
            <Activity size={20} className="text-[#FFC107]"/> 주간 자세 분석
          </h3>
          
          <div className="space-y-5">
            {[
              { day: '월', good: 82, bad: 18 },
              { day: '화', good: 90, bad: 10 },
              { day: '수', good: 75, bad: 25 },
              { day: '목', good: 88, bad: 12 },
              { day: '오늘', good: 85, bad: 15, current: true }
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className={`w-8 font-bold text-sm ${stat.current ? 'text-[#4CAF50]' : 'text-gray-500'}`}>
                  {stat.day}
                </span>
                <div className="flex-1 h-3 rounded-full bg-gray-700 flex overflow-hidden">
                  <div style={{ width: `${stat.good}%` }} className="bg-[#8BC34A] h-full rounded-l-full"></div>
                  <div style={{ width: `${stat.bad}%` }} className="bg-[#FFC107] h-full rounded-r-full"></div>
                </div>
                <span className="w-10 text-right text-sm font-bold text-gray-300">
                  {stat.good}%
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
