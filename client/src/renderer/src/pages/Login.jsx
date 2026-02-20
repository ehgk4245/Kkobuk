import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import logo from '../../../../resources/icon.png';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full h-full bg-gray-900 flex justify-center items-center p-6 font-sans relative">
      <div className="w-full max-w-sm bg-gray-800 rounded-[2.5rem] p-8 shadow-xl border border-gray-700 text-center flex flex-col items-center">
        
        {/* 로고 & 타이틀 */}
        <div className="mb-10 text-center animate-fade-in-down">
          <img src={logo} alt="Kkobuk" className="w-36 h-36 mx-auto mb-4 drop-shadow-lg" />
          <h1 className="text-3xl font-extrabold text-[#4CAF50] tracking-tight">Kkobuk</h1>
          <p className="text-gray-400 mt-2 font-medium">거북목 예방의 시작</p>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full relative flex items-center px-6 bg-[#FEE500] hover:bg-[#F4DC00] text-[#191919] font-bold py-4 rounded-2xl transition-all shadow-sm hover:-translate-y-0.5"
          >
            <RiKakaoTalkFill size={22} className="absolute left-6" />
            <span className="flex-1 text-center">카카오로 시작하기</span>
          </button>

          <button
            onClick={() => navigate('/onboarding')}
            className="w-full relative flex items-center px-6 bg-gray-700 hover:bg-gray-600 border border-transparent text-gray-200 font-bold py-4 rounded-2xl transition-all shadow-sm hover:-translate-y-0.5"
          >
            <FcGoogle size={22} className="absolute left-6" />
            <span className="flex-1 text-center">Google로 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
