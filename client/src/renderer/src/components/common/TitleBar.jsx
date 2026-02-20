import React from 'react';
import { Minus } from 'lucide-react';
import logo from '../../../../../resources/icon.png';

export default function TitleBar() {
  return (
    <div 
      className="hidden sm:flex w-full h-10 flex-row items-center justify-between px-4 select-none relative z-[100] bg-gray-900 transition-colors border-b border-gray-800 shrink-0"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div className="flex items-center gap-2 text-[#4CAF50] font-bold text-sm">
        <img src={logo} alt="Kkobuk" className="w-8 h-8" />
        Kkobuk
      </div>
      <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <button 
          onClick={() => window.api?.windowControl?.minimize()}
          className="p-1.5 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-gray-200" title="창 최소화"
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={() => window.api?.windowControl?.hide()}
          className="p-1.5 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-gray-200" title="트레이로 숨기기"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
