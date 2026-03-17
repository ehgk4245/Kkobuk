import PropTypes from 'prop-types'
import TextInput from '../../../components/common/TextInput'

export default function ModelNameForm({ modelName, modelDescription, onChange, disabled }) {
  return (
    <div className="mt-6 w-full max-w-2xl px-4 flex flex-col gap-3">
      <TextInput
        value={modelName}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="모델 이름 (예: 사무실 자세 모델)"
        disabled={disabled}
      />
      <TextInput
        value={modelDescription}
        onChange={(e) => onChange('description', e.target.value)}
        placeholder="설명 (선택사항)"
        disabled={disabled}
      />
    </div>
  )
}

ModelNameForm.propTypes = {
  modelName: PropTypes.string.isRequired,
  modelDescription: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired
}
