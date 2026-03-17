import PropTypes from 'prop-types'
import { User } from 'lucide-react'

export default function AccountSection({ onLogout }) {
  return (
    <section className="bg-gray-800 rounded-[2rem] p-6 shadow-md border border-gray-700">
      <div className="flex items-center gap-3 mb-5 text-gray-500">
        <User size={22} className="text-gray-400" />
        <h2 className="text-lg font-bold text-white">계정 관리</h2>
      </div>
      <button
        onClick={onLogout}
        className="w-full text-left px-2 py-3 text-red-500 font-medium hover:bg-red-500/10 rounded-xl transition"
      >
        로그아웃
      </button>
    </section>
  )
}

AccountSection.propTypes = {
  onLogout: PropTypes.func.isRequired
}
