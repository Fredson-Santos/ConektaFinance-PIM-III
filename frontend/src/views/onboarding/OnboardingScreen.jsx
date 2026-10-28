import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { budgetService, categoryService } from '../../services'
import { ApiError } from '../../services/api'
import { useAsync } from '../../hooks/useAsync'
import { Button } from '../../components/common/Button'
import { PasswordInput } from '../../components/common/Input'
import { Icon } from '../../components/common/Icon'
import { formatCurrency } from '../../utils/format'
import { maskMoney, moneyToMask, parseMoneyInput, passwordStrength } from '../../utils/money'

const STEPS = ['Identificação', 'Acesso', 'Meta mensal', 'Categorias', 'Boas-vindas']
const CEILING_SUGGESTIONS = [2000, 3500, 5000]
// Contas criadas via WhatsApp recebem um nome provisório até o onboarding.
const PLACEHOLDER_NAME = /^Contato \d+$/
// ...e um e-mail técnico, que o usuário substitui pelo e-mail real.
const PLACEHOLDER_EMAIL = /@wa\.conektafinance\.com$/i
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function OnboardingScreen() {
  const { user, completeOnboarding } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState(() =>
    user?.fullName && !PLACEHOLDER_NAME.test(user.fullName) ? user.fullName : '',
  )
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(() =>
    user?.email && !PLACEHOLDER_EMAIL.test(user.email) ? user.email : '',
  )
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [ceilingText, setCeilingText] = useState(() => (user?.monthlyCeiling > 0 ? moneyToMask(user.monthlyCeiling) : ''))
  const [custom, setCustom] = useState(() => user?.monthlyCeiling > 0 && !CEILING_SUGGESTIONS.includes(user.monthlyCeiling))
  const [limits, setLimits] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const categories = useAsync(() => categoryService.list({ kind: 'expense' }), [])

  const ceiling = parseMoneyInput(ceilingText)
  const preferredName = (displayName.trim() || fullName.trim()).split(' ')[0]
  const categoryLimits = (categories.data || [])
    .map((category) => ({ category, value: parseMoneyInput(limits[category.id]) }))
    .filter((item) => item.value)
  const distributed = categoryLimits.reduce((sum, item) => sum + item.value, 0)
  const overDistributed = Boolean(ceiling) && distributed > ceiling

  const validateIdentity = () => {
    const name = fullName.trim()
    if (name.length < 2) return { fullName: 'Informe seu nome para personalizarmos sua experiência.' }
    if (name.length > 255) return { fullName: 'O nome deve ter no máximo 255 caracteres.' }
    return {}
  }

  const validateAccess = () => {
    if (!EMAIL_PATTERN.test(email.trim())) return { email: 'Informe um e-mail válido, como nome@exemplo.com.' }
    if (email.trim().length > 255) return { email: 'O e-mail deve ter no máximo 255 caracteres.' }
    if (password.length < 8) return { password: 'A senha deve ter no mínimo 8 caracteres.' }
    if (password.length > 100) return { password: 'A senha deve ter no máximo 100 caracteres.' }
    if (password !== passwordConfirm) return { passwordConfirm: 'A confirmação não confere com a senha.' }
    return {}
  }

  const validateCeiling = () => {
    if (!ceiling) return { ceiling: 'Defina um teto mensal maior que R$ 0,00.' }
    if (ceiling > 10_000_000) return { ceiling: 'Informe um valor de até R$ 10.000.000,00.' }
    return {}
  }

  const next = (event) => {
    event?.preventDefault()
    const validators = [validateIdentity, validateAccess, validateCeiling]
    const found = validators[step]?.() ?? {}
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
      // Limites primeiro: se falharem, o usuário continua no onboarding e pode tentar de novo.
      const now = new Date()
      await Promise.all(
        categoryLimits.map(({ category, value }) =>
          budgetService.upsert({
            categoryId: category.id,
            limitValue: value,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          }),
        ),
      )
      await completeOnboarding({
        fullName: fullName.trim(),
        displayName: displayName.trim() || null,
        monthlyCeiling: ceiling,
        email: email.trim(),
        password,
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
          <form key="access" className="login-step" onSubmit={next} noValidate>
            <header className="login-head">
              <h1 id="onboarding-title" className="login-title">Crie seu acesso</h1>
              <p className="login-sub">
                Seu e-mail e sua senha protegem ações sensíveis da conta, como alterar dados de acesso ou excluí-la.
              </p>
            </header>
            <div className="login-field">
              <label className="login-label" htmlFor="onb-email">E-mail</label>
              <input
                id="onb-email"
                type="email"
                inputMode="email"
                className={`onboarding-input ${errors.email ? 'is-invalid' : ''}`}
                autoComplete="email"
                placeholder="nome@exemplo.com"
                value={email}
                maxLength={255}
                autoFocus
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => setEmail(event.target.value)}
              />
              {errors.email ? <span className="login-error" role="alert">{errors.email}</span> : null}
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="onb-password">Senha</label>
              <PasswordInput
                id="onb-password"
                className={`onboarding-input ${errors.password ? 'is-invalid' : ''}`}
                autoComplete="new-password"
                value={password}
                maxLength={100}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => setPassword(event.target.value)}
              />
              <div className={`pwd-meter s${passwordStrength(password)}`} aria-hidden="true">
                <i /><i /><i /><i />
              </div>
              {errors.password ? (
                <span className="login-error" role="alert">{errors.password}</span>
              ) : (
                <span className="login-hint">Mínimo de 8 caracteres. Combine letras, números e símbolos.</span>
              )}
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="onb-password-confirm">Confirmar senha</label>
              <PasswordInput
                id="onb-password-confirm"
                className={`onboarding-input ${errors.passwordConfirm ? 'is-invalid' : ''}`}
                autoComplete="new-password"
                value={passwordConfirm}
                maxLength={100}
                aria-invalid={Boolean(errors.passwordConfirm)}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
              {errors.passwordConfirm ? (
                <span className="login-error" role="alert">{errors.passwordConfirm}</span>
              ) : null}
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
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Voltar
              </Button>
              <Button type="submit" className="login-primary">
                Continuar <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <form key="limits" className="login-step" onSubmit={next} noValidate>
            <header className="login-head">
              <h1 id="onboarding-title" className="login-title">Quer definir limites por categoria?</h1>
              <p className="login-sub">
                Opcional. Defina quanto pretende gastar em cada categoria neste mês. Deixe em branco para pular.
              </p>
            </header>
            <ul className="onboarding-limits">
              {(categories.data || []).map((category) => (
                <li key={category.id}>
                  <label htmlFor={`onb-limit-${category.id}`} className="onboarding-limit-name">
                    <span className="onboarding-limit-icon" style={{ color: category.colorCode || 'var(--ds-foreground-muted)' }}>
                      <Icon name={category.icon || 'Tag'} size={14} />
                    </span>
                    {category.name}
                  </label>
                  <div className="onboarding-limit-input">
                    <span aria-hidden="true">R$</span>
                    <input
                      id={`onb-limit-${category.id}`}
                      inputMode="numeric"
                      placeholder="0,00"
                      aria-label={`Limite para ${category.name}`}
                      value={limits[category.id] || ''}
                      onChange={(event) =>
                        setLimits((current) => ({ ...current, [category.id]: maskMoney(event.target.value) }))
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className={`onboarding-distributed ${overDistributed ? 'is-over' : ''}`} aria-live="polite">
              <span>
                <b className="num">{formatCurrency(distributed)}</b> de <span className="num">{formatCurrency(ceiling)}</span> distribuídos
              </span>
              {overDistributed ? (
                <span>A soma dos limites passa do seu teto mensal.</span>
              ) : (
                <span>Restam {formatCurrency(Math.max(0, (ceiling || 0) - distributed))} sem categoria.</span>
              )}
            </div>
            <div className="onboarding-actions">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Voltar
              </Button>
              <Button type="submit" className="login-primary">
                {categoryLimits.length > 0 ? 'Continuar' : 'Pular por enquanto'} <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        ) : null}

        {step === 4 ? (
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
                <dt>E-mail</dt>
                <dd>{email.trim()}</dd>
              </div>
              <div>
                <dt>Teto mensal</dt>
                <dd className="num">{formatCurrency(ceiling)}</dd>
              </div>
            </dl>
            <div className="login-field">
              <span className="login-label">Categorias criadas para você</span>
              <ul className="onboarding-categories">
                {(categories.data || []).map((category) => {
                  const limit = parseMoneyInput(limits[category.id])
                  return (
                    <li key={category.id}>
                      <span style={{ color: category.colorCode || 'var(--ds-foreground-muted)' }}>
                        <Icon name={category.icon || 'Tag'} size={13} />
                      </span>
                      {category.name}
                      {limit ? <b className="num">{formatCurrency(limit)}</b> : null}
                    </li>
                  )
                })}
              </ul>
            </div>
            {errors.submit ? <span className="login-error" role="alert">{errors.submit}</span> : null}
            <div className="onboarding-actions">
              <Button variant="ghost" disabled={saving} onClick={() => setStep(3)}>
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
