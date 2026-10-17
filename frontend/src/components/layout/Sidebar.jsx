import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Target, 
  Sparkles, 
  Settings,
  DownloadCloud,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const Sidebar = () => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'transacoes', label: 'Transações', icon: ArrowLeftRight },
    { id: 'orcamentos', label: 'Orçamentos & Metas', icon: Target },
    { id: 'copilot', label: 'Copilot IA & Insights', icon: Sparkles, badge: 'IA' },
    { id: 'configuracoes', label: 'Configurações & PWA', icon: Settings },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0070f3 0%, #00cc88 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            color: '#fff',
            fontFamily: 'var(--font-mono)'
          }}>
            C
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.02em' }}>ConektaFinance</div>
            <div style={{ fontSize: '11px', color: 'var(--ds-foreground-muted)' }}>PIM IV — ADS UNIP</div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ds-foreground-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 12px 4px' }}>
          Navegação
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              style={{ width: '100%', textAlign: 'left', background: isActive ? undefined : 'transparent' }}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span className="ds-badge ds-badge-purple" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer info */}
      <div className="sidebar-footer">
        <div style={{
          padding: '12px',
          background: 'var(--ds-gray-alpha-100)',
          borderRadius: 'var(--ds-radius-lg)',
          border: '1px solid var(--ds-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}>
            <ShieldCheck size={14} color="var(--ds-green-700)" />
            <span>PWA & Offline Ready</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--ds-foreground-muted)', lineHeight: '1.4' }}>
            Instalável no Android, iOS e Windows com sincronização via API .NET.
          </p>
        </div>
      </div>
    </aside>
  );
};
