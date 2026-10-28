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
import { OnboardingScreen } from '../views/onboarding/OnboardingScreen'
import { AdminScreen } from '../views/admin/AdminScreen'

function RequireAuth({ children, onboarding = false }) {
  const { isAuthenticated, initialized, needsOnboarding } = useAuth()
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
  if (needsOnboarding && !onboarding) return <Navigate to="/boas-vindas" replace />
  if (!needsOnboarding && onboarding) return <Navigate to="/dashboard" replace />
  return children
}

// Guarda de perfil: usuário comum que digitar /admin volta ao dashboard.
function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/dashboard" replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<AuthScreen />}
      />
      <Route
        path="/boas-vindas"
        element={(
          <RequireAuth onboarding>
            <OnboardingScreen />
          </RequireAuth>
        )}
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
        <Route
          path="/admin"
          element={(
            <RequireAdmin>
              <AdminScreen />
            </RequireAdmin>
          )}
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
