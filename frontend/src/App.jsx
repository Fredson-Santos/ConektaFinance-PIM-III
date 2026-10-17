import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { TransactionModal } from './components/modals/TransactionModal';

import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { CopilotView } from './views/CopilotView';
import { SettingsView } from './views/SettingsView';

const MainApp = () => {
  const { activeTab } = useFinance();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'transacoes':
        return <TransactionsView />;
      case 'orcamentos':
        return <BudgetsView />;
      case 'copilot':
        return <CopilotView />;
      case 'configuracoes':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="app-main">
        <Topbar />
        
        <div className="content-container">
          {renderActiveView()}
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav />

      {/* Global Transaction Modal (Bottom Sheet on Mobile) */}
      <TransactionModal />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
