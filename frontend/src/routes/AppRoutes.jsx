import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { AuthScreen } from '../views/auth/AuthScreen'
import { BudgetsScreen } from '../views/budgets/BudgetsScreen'
import { TransactionsScreen } from '../views/transactions/TransactionsScreen'
import { Placeholder } from '../views/Placeholder'
import { DashboardScreen } from '../views/dashboard/DashboardScreen'
import { ReportsScreen } from '../views/reports/ReportsScreen'
import { SettingsScreen } from '../views/settings/SettingsScreen'

function RequireAuth({ children }) {
  const { isAuthenticated, initialized } = useAuth()
  if (!initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="typing-dots" aria-label="Carregando">
          <i />
          <i />
          <i />
        </span>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<AuthScreen />}
      />
      <Route
        element={(
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        )}
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/transacoes" element={<TransactionsScreen />} />
        <Route path="/categorias" element={<BudgetsScreen />} />
        <Route path="/relatorios" element={<ReportsScreen />} />
        <Route path="/configuracoes" element={<SettingsScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
