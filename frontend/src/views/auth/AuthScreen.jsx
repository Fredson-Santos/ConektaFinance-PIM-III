import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, MessageCircle, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { authService } from '../../services'
import { ApiError } from '../../services/api'
import { Button } from '../../components/common/Button'
import { OtpBoxes } from '../../components/common/OtpBoxes'
import { maskPhone, unmaskPhone } from '../../utils/phone'

export function AuthScreen() {
  const { loginByOtp, demoLogin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [remember, setRemember] = useState(true)
  const [devCode, setDevCode] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [resendIn, setResendIn] = useState(null)
  const [otpAttempt, setOtpAttempt] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  const startResendTimer = (seconds) => {
    setResendIn(seconds)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setResendIn((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current)
          return null
        }
        return current - 1
      })
    }, 1000)
  }

  const requestCode = async (event) => {
    event?.preventDefault()
    const digits = unmaskPhone(phone)
    if (digits.length < 10) {
      setError('Informe o DDD e o número completo do WhatsApp.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const response = await authService.requestOtp(digits)
      setDevCode(response.devCode)
      setStep('otp')
      startResendTimer(response.resendAllowedInSeconds || 45)
      toast.push('Código enviado ao seu WhatsApp!')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível enviar o código.')
    } finally {
      setLoading(false)
    }
  }

  const verify = async (code) => {
    setError(null)
    setLoading(true)
    try {
      await loginByOtp(unmaskPhone(phone), code, { remember })
      navigate('/dashboard')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Código inválido. Tente novamente.')
      setOtpAttempt((current) => current + 1)
      setLoading(false)
    }
  }

  const enterDemo = async () => {
    setDemoLoading(true)
    try {
      await demoLogin({ remember })
      toast.push('Bem-vindo à conta de demonstração!')
      navigate('/dashboard')
    } catch {
      toast.push('Demonstração indisponível neste momento.', 'error')
      setDemoLoading(false)
    }
  }

  const backToPhone = () => {
    setStep('phone')
    setError(null)
  }

  return (
    <div className="login-view">
      <main className="login-card" aria-labelledby="login-title">
        <header className="login-head">
          <div className="login-brand">
            <span className="login-brand-mark" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L14 9L20 11L14 13L12 19L10 13L4 11L10 9L12 3Z" />
              </svg>
            </span>
            <span className="login-brand-name">ConektaFinance</span>
          </div>
          <h1 id="login-title" className="login-title">
            {step === 'phone' ? 'Acesse sua conta' : 'Digite o código'}
          </h1>
          <p className="login-sub">
            {step === 'phone'
              ? 'Entre com seu WhatsApp. Sem senhas para lembrar.'
              : (
                <>
                  Enviamos um código de 6 dígitos para <b>+55 {phone}</b>
                </>
              )}
          </p>
        </header>

        {step === 'phone' ? (
          <form key="phone" className="login-step" onSubmit={requestCode} noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="login-phone">
                WhatsApp
              </label>
              <div className={`login-phone ${error ? 'is-invalid' : ''}`}>
                <span className="login-phone-prefix" aria-hidden="true">
                  🇧🇷 +55
                </span>
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(event) => setPhone(maskPhone(event.target.value))}
                  aria-label="Número do WhatsApp"
                  aria-invalid={Boolean(error)}
                  aria-describedby="login-phone-msg"
                />
              </div>
              <span id="login-phone-msg" className={error ? 'login-error' : 'login-hint'} role={error ? 'alert' : undefined}>
                {error || 'Enviaremos um código de verificação pelo WhatsApp.'}
              </span>
            </div>

            <label className="login-remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span className="login-check" aria-hidden="true">
                <Check size={12} strokeWidth={3} />
              </span>
              Lembrar de mim neste dispositivo
            </label>

            <Button type="submit" className="login-primary" icon={MessageCircle} fullWidth loading={loading}>
              Receber código no WhatsApp
            </Button>
          </form>
        ) : (
          <div key="otp" className="login-step">
            <div className="login-otp">
              <OtpBoxes key={otpAttempt} onComplete={verify} disabled={loading} invalid={Boolean(error)} />
              {error ? (
                <span className="login-error" role="alert">
                  {error}
                </span>
              ) : null}
              {loading ? (
                <span className="login-hint login-verifying">
                  <span className="ds-spinner" aria-hidden="true" /> Verificando código…
                </span>
              ) : null}
            </div>

            {devCode ? (
              <Button variant="secondary" fullWidth disabled={loading} onClick={() => verify(devCode)}>
                Preencher código de demonstração ({devCode})
              </Button>
            ) : null}

            <div className="login-otp-actions">
              <button type="button" className="login-link" onClick={backToPhone}>
                <ArrowLeft size={14} /> Alterar número
              </button>
              <button
                type="button"
                className="login-link"
                disabled={resendIn !== null || loading}
                onClick={() => requestCode()}
              >
                {resendIn !== null ? `Reenviar em 0:${String(resendIn).padStart(2, '0')}` : 'Reenviar código'}
              </button>
            </div>
          </div>
        )}

        <div className="login-divider" aria-hidden="true">
          <span>ou</span>
        </div>

        <Button variant="ghost" className="login-demo" icon={Sparkles} fullWidth loading={demoLoading} onClick={enterDemo}>
          Explorar conta de demonstração
          <ArrowRight size={14} className="login-demo-arrow" />
        </Button>

        <p className="login-legal">
          Ao continuar você concorda com os Termos de Uso e a Política de Privacidade.
        </p>
      </main>
    </div>
  )
}

export default AuthScreen
