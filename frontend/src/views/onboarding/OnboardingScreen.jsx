import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { categoryService } from '../../services'
import { ApiError } from '../../services/api'
import { useAsync } from '../../hooks/useAsync'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { formatCurrency } from '../../utils/format'
import { maskMoney, moneyToMask, parseMoneyInput } from '../../utils/money'

const STEPS = ['Identificação', 'Meta mensal', 'Boas-vindas']
const CEILING_SUGGESTIONS = [2000, 3500, 5000]
// Contas criadas via WhatsApp recebem um nome provisório até o onboarding.
const PLACEHOLDER_NAME = /^Contato \d+$/

export function OnboardingScreen() {
  const { user, completeOnboarding } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState(() =>
    user?.fullName && !PLACEHOLDER_NAME.test(user.fullName) ? user.fullName : '',
  )
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [ceilingText, setCeilingText] = useState(() => (user?.monthlyCeiling > 0 ? moneyToMask(user.monthlyCeiling) : ''))
  const [custom, setCustom] = useState(() => user?.monthlyCeiling > 0 && !CEILING_SUGGESTIONS.includes(user.monthlyCeiling))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const categories = useAsync(() => categoryService.list({ kind: 'expense' }), [])

  const ceiling = parseMoneyInput(ceilingText)
  const preferredName = (displayName.trim() || fullName.trim()).split(' ')[0]

  const validateIdentity = () => {
    const name = fullName.trim()
    if (name.length < 2) return { fullName: 'Informe seu nome para personalizarmos sua experiência.' }
    if (name.length > 255) return { fullName: 'O nome deve ter no máximo 255 caracteres.' }
    return {}
  }

  const validateCeiling = () => {
    if (!ceiling) return { ceiling: 'Defina um teto mensal maior que R$ 0,00.' }
    if (ceiling > 10_000_000) return { ceiling: 'Informe um valor de até R$ 10.000.000,00.' }
    return {}
  }

  const next = (event) => {
    event?.preventDefault()
    const found = step === 0 ? validateIdentity() : validateCeiling()
    setErrors(found)
    if (Object.keys(found).length === 0) setStep((current) => current + 1)
  }

  const pickSuggestion = (value) => {
    setCustom(false)
    setCeilingText(moneyToMask(value))
    setErrors({})
  }

  const finish = async () => {
    setSaving(true)
    setErrors({})
    try {
      await completeOnboarding({
        fullName: fullName.trim(),
        displayName: displayName.trim() || null,
        monthlyCeiling: ceiling,
      })
      toast.push('Tudo pronto! Seu painel já está configurado.')
      navigate('/dashboard', { replace: true })
    } catch (caught) {
      setErrors({ submit: caught instanceof ApiError ? caught.message : 'Não foi possível salvar seus dados.' })
      setSaving(false)
    }
  }

  return (
    <div className="login-view">
      <main className="login-card onboarding-card" aria-labelledby="onboarding-title">
        <ol className="onboarding-progress" aria-label={`Etapa ${step + 1} de ${STEPS.length}`}>
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={index < step ? 'done' : index === step ? 'current' : ''}
              aria-current={index === step ? 'step' : undefined}
            >
              <span>{label}</span>
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <form key="identity" className="login-step" onSubmit={next} noValidate>
            <header className="login-head">
              <h1 id="onboarding-title" className="login-title">Como podemos te chamar?</h1>
              <p className="login-sub">Leva menos de um minuto para deixar seu painel com a sua cara.</p>
            </header>
            <div className="login-field">
              <label className="login-label" htmlFor="onb-fullname">Nome completo</label>
              <input
                id="onb-fullname"
                className={`onboarding-input ${errors.fullName ? 'is-invalid' : ''}`}
                autoComplete="name"
                placeholder="Ex.: Maria Oliveira"
                value={fullName}
                maxLength={255}
                autoFocus
                aria-invalid={Boolean(errors.fullName)}
                onChange={(event) => setFullName(event.target.value)}
              />
              {errors.fullName ? <span className="login-error" role="alert">{errors.fullName}</span> : null}
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="onb-display">
                Nome de preferência <span className="onboarding-optional">(opcional)</span>
              </label>
              <input
                id="onb-display"
                className="onboarding-input"
                autoComplete="nickname"
                placeholder="Ex.: Mari"
                value={displayName}
                maxLength={120}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <Button type="submit" className="login-primary" fullWidth>
              Continuar <ArrowRight size={16} />
            </Button>
          </form>
        ) : null}

        {step === 1 ? (
          <form key="ceiling" className="login-step" onSubmit={next} noValidate>
            <header className="login-head">
              <h1 id="onboarding-title" className="login-title">Qual seu teto de gastos mensal?</h1>
              <p className="login-sub">
                Usamos esse valor para acompanhar seu consumo e avisar quando você estiver perto do limite.
              </p>
            </header>
            <div className="onboarding-suggestions" role="radiogroup" aria-label="Sugestões de teto mensal">
              {CEILING_SUGGESTIONS.map((value) => {
                const selected = !custom && ceiling === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`onboarding-chip ${selected ? 'on' : ''}`}
                    onClick={() => pickSuggestion(value)}
                  >
                    {formatCurrency(value).replace(',00', '')}
                  </button>
                )
              })}
              <button
                type="button"
                role="radio"
                aria-checked={custom}
                className={`onboarding-chip ${custom ? 'on' : ''}`}
                onClick={() => {
                  setCustom(true)
                  setCeilingText('')
                }}
              >
                Personalizado
              </button>
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="onb-ceiling">Teto mensal</label>
              <div className={`login-phone ${errors.ceiling ? 'is-invalid' : ''}`}>
                <span className="login-phone-prefix" aria-hidden="true">R$</span>
                <input
                  id="onb-ceiling"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={ceilingText}
                  aria-invalid={Boolean(errors.ceiling)}
                  onFocus={() => setCustom(true)}
                  onChange={(event) => {
                    setCustom(true)
                    setCeilingText(maskMoney(event.target.value))
                  }}
                />
              </div>
              {errors.ceiling ? (
                <span className="login-error" role="alert">{errors.ceiling}</span>
              ) : (
                <span className="login-hint">Você pode ajustar esse valor quando quiser direto no painel.</span>
              )}
            </div>
            <div className="onboarding-actions">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft size={16} /> Voltar
              </Button>
              <Button type="submit" className="login-primary">
                Continuar <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div key="welcome" className="login-step">
            <header className="login-head">
              <span className="onboarding-check" aria-hidden="true">
                <Check size={18} strokeWidth={3} />
              </span>
              <h1 id="onboarding-title" className="login-title">Tudo pronto, {preferredName}!</h1>
              <p className="login-sub">Confira o resumo antes de entrar no seu painel.</p>
            </header>
            <dl className="onboarding-summary">
              <div>
                <dt>Nome</dt>
                <dd>{fullName.trim()}</dd>
              </div>
              <div>
                <dt>Teto mensal</dt>
                <dd className="num">{formatCurrency(ceiling)}</dd>
              </div>
            </dl>
            <div className="login-field">
              <span className="login-label">Categorias criadas para você</span>
              <ul className="onboarding-categories">
                {(categories.data || []).map((category) => (
                  <li key={category.id}>
                    <span style={{ color: category.colorCode || 'var(--ds-foreground-muted)' }}>
                      <Icon name={category.icon || 'Tag'} size={13} />
                    </span>
                    {category.name}
                  </li>
                ))}
              </ul>
            </div>
            {errors.submit ? <span className="login-error" role="alert">{errors.submit}</span> : null}
            <div className="onboarding-actions">
              <Button variant="ghost" disabled={saving} onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Voltar
              </Button>
              <Button className="login-primary" loading={saving} onClick={finish}>
                Ir para o Dashboard <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default OnboardingScreen
