import { useEffect, useRef } from 'react'

export function OtpBoxes({ length = 6, onComplete, disabled = false, invalid = false }) {
  const refs = useRef([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  const setValue = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    refs.current[index].value = digit
    if (digit && index < length - 1) refs.current[index + 1].focus()
    const joined = refs.current.map((ref) => ref?.value || '').join('')
    if (joined.length === length && onComplete) onComplete(joined)
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !refs.current[index].value && index > 0) {
      refs.current[index - 1].focus()
    }
  }

  const handlePaste = (event, index) => {
    event.preventDefault()
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length - index)
    digits.split('').forEach((digit, offset) => {
      refs.current[index + offset].value = digit
    })
    const focusIndex = Math.min(index + digits.length, length - 1)
    refs.current[focusIndex].focus()
    const joined = refs.current.map((ref) => ref?.value || '').join('')
    if (joined.length === length && onComplete) onComplete(joined)
  }

  return (
    <div className={`otp-boxes ${invalid ? 'is-invalid' : ''}`} role="group" aria-label="Código de verificação">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(ref) => {
            refs.current[index] = ref
          }}
          className="otp-box"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-label={`Dígito ${index + 1}`}
          onChange={(event) => setValue(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={(event) => handlePaste(event, index)}
        />
      ))}
    </div>
  )
}

export default OtpBoxes
