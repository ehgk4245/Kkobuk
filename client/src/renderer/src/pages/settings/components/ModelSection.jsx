import PropTypes from 'prop-types'
import { Database, Plus, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MODEL_LIMIT = 5

export default function ModelSection({ models, modelsLoading, activatingId, deletingId, onActivate, onDelete }) {
  const navigate = useNavigate()

  return (
    <section className="bg-gray-800 rounded-[2rem] p-6 shadow-md border border-gray-700">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Database size={22} className="text-[#8BC34A]" />
          <h2 className="text-lg font-bold text-white">학습 모델 설정</h2>
          {!modelsLoading && (
            <span className="text-xs text-gray-500 font-medium">
              {models.length}/{MODEL_LIMIT}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/training')}
          disabled={models.length >= MODEL_LIMIT}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
          title={models.length >= MODEL_LIMIT ? `모델은 최대 ${MODEL_LIMIT}개까지 학습할 수 있습니다` : undefined}
        >
          <Plus size={14} /> 모델 학습
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
              <div className="flex items-center gap-2 shrink-0">
                {model.status !== 'ACTIVE' && (
                  <button
                    onClick={() => onActivate(model.id)}
                    disabled={activatingId !== null || deletingId !== null}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-200 transition disabled:opacity-50"
                  >
                    {activatingId === model.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      '적용'
                    )}
                  </button>
                )}
                <button
                  onClick={() => onDelete(model.id)}
                  disabled={deletingId !== null || activatingId !== null}
                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition disabled:opacity-50"
                >
                  {deletingId === model.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

ModelSection.propTypes = {
  models: PropTypes.array.isRequired,
  modelsLoading: PropTypes.bool.isRequired,
  activatingId: PropTypes.number,
  deletingId: PropTypes.number,
  onActivate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}
