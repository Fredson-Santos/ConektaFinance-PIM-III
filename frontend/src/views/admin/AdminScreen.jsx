import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, UserCheck, UserX, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { adminService } from '../../services'
import { ApiError } from '../../services/api'
import { useAsync } from '../../hooks/useAsync'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Modal } from '../../components/common/Modal'
import { SkeletonCard, SkeletonRows } from '../../components/common/Skeleton'

const PAGE_SIZE = 10
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

const METRICS = [
  { key: 'totalUsers', label: 'Usuários cadastrados' },
  { key: 'activeUsersLast30Days', label: 'Ativos nos últimos 30 dias' },
  { key: 'newUsersThisMonth', label: 'Novos neste mês' },
  { key: 'inactiveAccounts', label: 'Contas desativadas' },
  { key: 'transactionsThisMonth', label: 'Lançamentos no mês' },
  { key: 'alertsThisMonth', label: 'Alertas gerados no mês' },
  { key: 'aiMessagesWebThisMonth', label: 'Perguntas à IA (web)' },
  { key: 'aiMessagesWhatsAppThisMonth', label: 'Perguntas à IA (WhatsApp)' },
]

export function AdminScreen() {
  const { user } = useAuth()
  const toast = useToast()
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [overrides, setOverrides] = useState({})
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)
  const metrics = useAsync(() => adminService.metrics(), [])
  const users = useAsync(() => adminService.users({ search, page, pageSize: PAGE_SIZE }), [search, page])

  // Busca com pequeno atraso para não consultar a API a cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText])

  const items = (users.data?.items || []).map((item) => overrides[item.id] || item)
  const totalPages = Math.max(1, Math.ceil((users.data?.totalItems || 0) / PAGE_SIZE))

  const confirmStatus = async () => {
    setSaving(true)
    try {
      const updated = await adminService.updateStatus(pending.id, !pending.isActive)
      setOverrides((current) => ({ ...current, [updated.id]: updated }))
      toast.push(updated.isActive ? 'Conta reativada.' : 'Conta desativada.')
      setPending(null)
      metrics.refetch()
    } catch (caught) {
      toast.push(caught instanceof ApiError ? caught.message : 'Não foi possível alterar o status.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-view">
      <section aria-labelledby="admin-metrics-title">
        <h2 id="admin-metrics-title" className="card-title admin-section-title">Visão geral da plataforma</h2>
        {metrics.error ? (
          <ErrorState message={metrics.error.message} onRetry={metrics.refetch} />
        ) : (
          <div className="admin-metrics">
            {METRICS.map((metric) =>
              metrics.loading ? (
                <SkeletonCard key={metric.key} height={92} />
              ) : (
                <div key={metric.key} className="card kpi-card">
                  <div className="kpi-label">{metric.label}</div>
                  <div className="kpi-value num">{metrics.data?.[metric.key] ?? 0}</div>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <section className="card admin-users" aria-labelledby="admin-users-title">
        <div className="admin-users-head">
          <h2 id="admin-users-title" className="card-title">Usuários</h2>
          <label className="admin-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por nome, e-mail ou telefone"
              aria-label="Buscar usuários"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>
        </div>

        {users.loading ? <SkeletonRows rows={5} /> : null}
        {users.error ? <ErrorState message={users.error.message} onRetry={users.refetch} /> : null}
        {!users.loading && !users.error && items.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Ajuste a busca para ver outras contas." />
        ) : null}

        {!users.loading && !users.error && items.length > 0 ? (
          <>
            <ul className="admin-user-list">
              {items.map((item) => (
                <li key={item.id} className="admin-user-row">
                  <div className="admin-user-main">
                    <p className="admin-user-name">
                      {item.fullName}
                      {item.accountType === 'Admin' ? <Badge variant="blue">Admin</Badge> : null}
                    </p>
                    <p className="admin-user-meta">{item.email}{item.phone ? ` · ${item.phone}` : ''}</p>
                  </div>
                  <dl className="admin-user-stats">
                    <div>
                      <dt>Cadastro</dt>
                      <dd>{formatDate(item.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Lançamentos</dt>
                      <dd className="num">{item.transactionCount}</dd>
                    </div>
                    <div>
                      <dt>Última atividade</dt>
                      <dd>{formatDate(item.lastActivityAt)}</dd>
                    </div>
                  </dl>
                  <div className="admin-user-actions">
                    <Badge variant={item.isActive ? 'green' : 'red'}>{item.isActive ? 'Ativa' : 'Desativada'}</Badge>
                    {item.id !== user?.id ? (
                      <Button
                        variant={item.isActive ? 'secondary' : 'blue'}
                        icon={item.isActive ? UserX : UserCheck}
                        onClick={() => setPending(item)}
                        aria-label={`${item.isActive ? 'Desativar' : 'Reativar'} conta de ${item.fullName}`}
                      >
                        {item.isActive ? 'Desativar' : 'Reativar'}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <nav className="admin-pagination" aria-label="Paginação de usuários">
              <Button variant="ghost" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anterior
              </Button>
              <span>
                Página {page} de {totalPages}
              </span>
              <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Próxima <ChevronRight size={14} />
              </Button>
            </nav>
          </>
        ) : null}
      </section>

      <Modal
        open={Boolean(pending)}
        onClose={() => (saving ? null : setPending(null))}
        title={pending?.isActive ? 'Desativar conta' : 'Reativar conta'}
      >
        <p className="admin-confirm-text">
          {pending?.isActive
            ? `${pending?.fullName} não conseguirá mais entrar na plataforma nem usar o assistente pelo WhatsApp até a conta ser reativada.`
            : `${pending?.fullName} voltará a ter acesso à plataforma.`}
        </p>
        <div className="admin-confirm-actions">
          <Button variant="ghost" disabled={saving} onClick={() => setPending(null)}>
            Cancelar
          </Button>
          <Button variant={pending?.isActive ? 'danger' : 'blue'} loading={saving} onClick={confirmStatus}>
            {pending?.isActive ? 'Desativar conta' : 'Reativar conta'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminScreen
