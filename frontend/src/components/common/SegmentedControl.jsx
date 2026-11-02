export function SegmentedControl({ options, value, onChange, name, className }) {
  return (
    <div className={`theme-pill seg ${className || ''}`} role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`${value === option.value ? 'active on' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default SegmentedControl
