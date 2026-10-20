import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, Lock, ShieldAlert, Download, Upload, Camera, Trash2 } from 'lucide-react'
import { userService, reportService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { useUi } from '../../context/UiContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { Field, Input, PasswordInput } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { Avatar } from '../../components/common/Avatar'
import { monthPeriod } from '../../utils/dates'
import { passwordStrength } from '../../utils/money'

const TABS = [
  { value: 'geral', label: 'Geral', icon: User },
  { value: 'senha', label: 'Senha', icon: Lock },
  { value: 'privacidade', label: 'Privacidade', icon: ShieldAlert },
]

export function SettingsScreen() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'geral'

  const setTab = (value) => {
    const next = new URLSearchParams(params)
    next.set('tab', value)
    setParams(next, { replace: true })
  }

  return (
    <div className="cfg-layout">
      <div className="cfg-nav" role="tablist" aria-label="Seções de configurações">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            className={`cfg-tab ${tab === item.value ? 'active' : ''}`}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'geral' ? <GeneralTab /> : null}
      {tab === 'senha' ? <PasswordTab /> : null}
      {tab === 'privacidade' ? <PrivacyTab /> : null}
    </div>
  )
}

function GeneralTab() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    displayName: user?.displayName || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    occupation: user?.occupation || '',
  })
  const [ceiling, setCeiling] = useState(String(user?.monthlyCeiling || 0).replace('.', ','))
  const [cycleDay, setCycleDay] = useState(user?.cycleStartDay || 1)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      displayName: user?.displayName || '',
      phone: user?.phone || '',
      cpf: user?.cpf || '',
      occupation: user?.occupation || '',
    })
    setCeiling(String(user?.monthlyCeiling || 0).replace('.', ','))
    setCycleDay(user?.cycleStartDay || 1)
  }, [user])

  const saveProfile = async (event) => {
    event.preventDefault()
    setSavingProfile(true)
    try {
      await userService.updateProfile(form)
      await refreshUser()
      toast.push('Perfil atualizado com sucesso!')
    } catch (error) {
      toast.push(error.message, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePreferences = async (event) => {
    event.preventDefault()
    setSavingPrefs(true)
    try {
      const parsed = Number(ceiling.replace(/\./g, '').replace(',', '.')) || 0
      await userService.updatePreferences({ monthlyCeiling: parsed, cycleStartDay: cycleDay })
      await refreshUser()
      toast.push('Metas orçamentárias atualizadas!')
    } catch (error) {
      toast.push(error.message, 'error')
    } finally {
      setSavingPrefs(false)
    }
  }

  const uploadAvatar = async (file) => {
    try {
      await userService.uploadAvatar(file)
      await refreshUser()
      toast.push('Foto de perfil atualizada!')
    } catch (error) {
      toast.push(error.message, 'error')
    }
  }

  return (
    <div className="cfg-pane">
      <section className="ds-card cfg-card" aria-label="Foto de perfil">
        <div className="cfg-card-title"><Camera size={16} /> Foto de perfil</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={user?.fullName} src={user?.avatarUrl} size={64} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>Alterar foto</Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event) => event.target.files[0] && uploadAvatar(event.target.files[0])}
            />
          </div>
        </div>
        <span className="ds-hint">Formatos aceitos: JPG, PNG ou WebP. Máximo de 2MB.</span>
      </section>

      <form className="ds-card cfg-card" onSubmit={saveProfile} aria-label="Dados pessoais">
        <div className="cfg-card-title"><User size={16} /> Dados pessoais</div>
        <div className="cfg-row">
          <Field label="Nome completo">
            <Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
          </Field>
          <Field label="Nome de exibição">
            <Input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
          </Field>
          <Field label="E-mail">
            <Input value={user?.email || ''} disabled aria-label="E-mail (somente leitura)" />
          </Field>
          <Field label="Telefone / WhatsApp">
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field label="CPF">
            <Input value={form.cpf} onChange={(event) => setForm({ ...form, cpf: event.target.value })} />
          </Field>
          <Field label="Ocupação">
            <Input value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} />
          </Field>
        </div>
        <Button type="submit" loading={savingProfile}>Salvar alterações</Button>
      </form>

      <form className="ds-card cfg-card" onSubmit={savePreferences} aria-label="Parâmetros orçamentários">
        <div className="cfg-card-title">Parâmetros orçamentários</div>
        <div className="cfg-row">
          <Field label="Teto orçamentário mensal (R$)">
            <Input inputMode="decimal" value={ceiling} onChange={(event) => setCeiling(event.target.value)} />
          </Field>
          <Field label="Início do ciclo">
            <select className="ds-input" value={cycleDay} onChange={(event) => setCycleDay(Number(event.target.value))}>
              <option value={1}>Dia 01 de cada mês</option>
              <option value={5}>Dia 05 de cada mês</option>
              <option value={10}>Dia 10 de cada mês</option>
              <option value={15}>Dia 15 de cada mês</option>
              <option value={28}>Dia 28 de cada mês</option>
            </select>
          </Field>
        </div>
        <span className="ds-hint">Moeda operacional: {user?.currency || 'BRL'} — Real Brasileiro (R$)</span>
        <Button type="submit" variant="blue" loading={savingPrefs}>Atualizar metas</Button>
      </form>
    </div>
  )
}

function PasswordTab() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (next !== confirm) {
      setError('A confirmação não confere com a nova senha.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await userService.changePassword(current, next)
      toast.push('Senha atualizada com sucesso!')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="cfg-pane" onSubmit={submit} aria-label="Alterar senha">
      <section className="ds-card cfg-card">
        <div className="cfg-card-title"><Lock size={16} /> Alterar senha</div>
        <Field label="Senha atual">
          <PasswordInput autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
        </Field>
        <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
          <PasswordInput autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} />
        </Field>
        <div className={`pwd-meter s${passwordStrength(next)}`} aria-hidden="true">
          <i /><i /><i /><i />
        </div>
        <Field label="Confirmar nova senha" error={error}>
          <PasswordInput autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </Field>
        <Button type="submit" loading={saving}>Atualizar senha</Button>
      </section>
    </form>
  )
}

function PrivacyTab() {
  const { discreet, toggleDiscreet } = useUi()
  const toast = useToast()
  const { openOverlay } = useUi()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const now = new Date()
  const range = monthPeriod(now.getMonth() + 1, now.getFullYear())

  const resetData = async () => {
    setBusy(true)
    try {
      await userService.resetData()
      toast.push('Registros financeiros redefinidos. Categorias preservadas.')
      setConfirmReset(false)
      navigate('/dashboard')
    } catch (error) {
      toast.push(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const deleteAccount = async () => {
    setBusy(true)
    try {
      await userService.deleteAccount(password)
      logout()
      toast.push('Conta excluída. Sentiremos sua falta!')
      setConfirmDelete(false)
      navigate('/login')
    } catch (error) {
      toast.push(error.message, 'error')
      setBusy(false)
    }
  }

  return (
    <div className="cfg-pane">
      <section className="ds-card cfg-card" aria-label="Modo discreto">
        <div className="cfg-card-title">Privacidade em locais públicos</div>
        <div className="toggle-row">
          <span>
            <b>Modo discreto</b>
            <p>Oculta cifras e saldos automaticamente ao abrir a aplicação em locais públicos.</p>
          </span>
          <button
            type="button"
            className={`switch ${discreet ? 'on' : ''}`}
            role="switch"
            aria-checked={discreet}
            aria-label="Modo discreto"
            onClick={toggleDiscreet}
          >
            <i />
          </button>
        </div>
      </section>

      <section className="ds-card cfg-card" aria-label="Importação e exportação">
        <div className="cfg-card-title"><Upload size={16} /> Importação e exportação</div>
        <div className="quick-actions">
          <button type="button" className="quick-action" onClick={() => openOverlay('import')}>
            <span className="qa-icon"><Upload size={15} /></span> Importar extrato / planilha
          </button>
          <button
            type="button"
            className="quick-action"
            onClick={() => reportService.exportCsv(range.start, range.end).catch(() => toast.push('Falha ao exportar CSV.', 'error'))}
          >
            <span className="qa-icon"><Download size={15} /></span> Exportar transações em CSV
          </button>
          <button
            type="button"
            className="quick-action"
            onClick={() => reportService.exportJson(range.start, range.end).catch(() => toast.push('Falha ao exportar JSON.', 'error'))}
          >
            <span className="qa-icon"><Download size={15} /></span> Exportar dados em JSON
          </button>
        </div>
      </section>

      <section className="ds-card danger-card" aria-label="Zona de perigo">
        <div className="cfg-card-title"><Trash2 size={16} /> Zona de perigo</div>
        <div className="toggle-row">
          <span>
            <b>Redefinir registros financeiros</b>
            <p>Remove todas as transações, orçamentos e alertas, mantendo suas categorias configuradas.</p>
          </span>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>Redefinir</Button>
        </div>
        <div className="toggle-row">
          <span>
            <b>Excluir conta permanentemente</b>
            <p>Apaga sua conta e todos os dados associados. Esta ação não pode ser desfeita.</p>
          </span>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Excluir conta</Button>
        </div>
      </section>

      {confirmReset ? (
        <Modal open title="Redefinir registros financeiros" onClose={() => setConfirmReset(false)}>
          <p style={{ fontSize: 13, color: 'var(--ds-foreground-muted)' }}>
            Todas as transações, orçamentos e alertas serão removidos. Suas categorias permanecem. Deseja continuar?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancelar</Button>
            <Button variant="danger" loading={busy} onClick={resetData}>Sim, redefinir</Button>
          </div>
        </Modal>
      ) : null}

      {confirmDelete ? (
        <Modal open title="Excluir conta permanentemente" onClose={() => setConfirmDelete(false)}>
          <p style={{ fontSize: 13, color: 'var(--ds-foreground-muted)' }}>
            Esta ação é irreversível. Informe sua senha para confirmar a exclusão da conta.
          </p>
          <Field label="Sua senha">
            <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="danger" loading={busy} disabled={!password} onClick={deleteAccount}>
              Excluir definitivamente
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default SettingsScreen
