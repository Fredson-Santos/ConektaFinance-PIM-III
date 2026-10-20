import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { authService } from '../../services'
import { ApiError } from '../../services/api'
import { Field, Input, PasswordInput } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { OtpBoxes } from '../../components/common/OtpBoxes'
import { maskPhone, unmaskPhone } from '../../utils/phone'

export function AuthScreen() {
  const [tab, setTab] = useState('whatsapp')

  return (
    <div className="auth-view">
      <div className="auth-card ds-card" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="auth-brand-mark">C</div>
          <div>
            <div className="auth-badge">Plataforma ConektaFinance</div>
          </div>
        </div>
        <h1 className="auth-title">Acesse sua conta</h1>
        <p className="auth-sub">Controle suas finanças com inteligência, em poucos toques.</p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'whatsapp'}
            className={`auth-tab ${tab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setTab('whatsapp')}
          >
            WhatsApp (OTP)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'email'}
            className={`auth-tab ${tab === 'email' ? 'active' : ''}`}
            onClick={() => setTab('email')}
          >
            E-mail
          </button>
        </div>

        {tab === 'whatsapp' ? <WhatsAppFlow /> : <EmailFlow />}
      </div>
    </div>
  )
}

function WhatsAppFlow() {
  const { loginByOtp } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(null)
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

  const requestCode = async () => {
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
      toast.push('Código PIN enviado ao seu WhatsApp!')
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
      await loginByOtp(unmaskPhone(phone), code)
      navigate('/dashboard')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Código inválido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <>
        <div className="otp-sent-box">
          <span>
            Enviado para <b>{phone}</b>
          </span>
          <button
            type="button"
            className="otp-resend"
            onClick={() => {
              setStep('phone')
              setError(null)
            }}
          >
            <ArrowLeft size={13} /> Alterar
          </button>
        </div>
        <Field label="Código de verificação" error={error}>
          <OtpBoxes onComplete={verify} />
        </Field>
        {devCode ? (
          <Button variant="secondary" onClick={() => verify(devCode)}>
            Preencher código de demonstração ({devCode})
          </Button>
        ) : null}
        <button
          type="button"
          className="otp-resend"
          disabled={resendIn !== null}
          onClick={requestCode}
          style={{ textAlign: 'center' }}
        >
          {resendIn !== null ? `Aguarde 0:${String(resendIn).padStart(2, '0')}` : 'Reenviar agora'}
        </button>
      </>
    )
  }

  return (
    <>
      <Field label="WhatsApp" error={error} hint="Enviaremos um código de 6 dígitos para validar seu acesso.">
        <div style={{ position: 'relative' }}>
          <span className="phone-country">🇧🇷 +55</span>
          <Input
            type="tel"
            inputMode="numeric"
            placeholder="(11) 98765-4321"
            value={phone}
            style={{ paddingLeft: 74 }}
            onChange={(event) => setPhone(maskPhone(event.target.value))}
            onKeyDown={(event) => event.key === 'Enter' && requestCode()}
            aria-label="Número do WhatsApp"
          />
        </div>
      </Field>
      <Button variant="whatsapp" icon={MessageCircle} fullWidth loading={loading} onClick={requestCode}>
        Receber código no WhatsApp
      </Button>
      <DemoAccess />
    </>
  )
}

function EmailFlow() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!email || !password) {
      setError('Informe e-mail e senha para entrar.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="E-mail">
        <Input
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field label="Senha" error={error}>
        <PasswordInput
          autoComplete="current-password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <Button type="submit" fullWidth loading={loading}>
        Entrar
      </Button>
      <DemoAccess />
    </form>
  )
}

function DemoAccess() {
  const { demoLogin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const enterDemo = async () => {
    setLoading(true)
    try {
      await demoLogin()
      toast.push('Bem-vindo à conta de demonstração!')
      navigate('/dashboard')
    } catch {
      toast.push('Demonstração indisponível neste momento.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="auth-divider">ou acesso de demonstração</div>
      <Button variant="secondary" fullWidth loading={loading} onClick={enterDemo}>
        Acesso rápido para demonstração (1 clique)
      </Button>
      <p className="auth-footer-note">
        Ao continuar você concorda com os Termos de Uso e a Política de Privacidade do ConektaFinance.
      </p>
    </>
  )
}

export default AuthScreen
