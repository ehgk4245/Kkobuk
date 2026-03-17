import PropTypes from 'prop-types'

export default function TextInput({ value, onChange, placeholder, disabled }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8BC34A] transition disabled:opacity-50"
    />
  )
}

TextInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool
}
