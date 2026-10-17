import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Plus, 
  Sparkles, 
  Target 
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const BottomNav = () => {
  const { activeTab, setActiveTab, setIsModalOpen } = useFinance();

  return (
    <nav className="mobile-bottom-nav">
      <button 
        className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        <LayoutDashboard size={20} />
        <span>Início</span>
      </button>

      <button 
        className={`bottom-nav-item ${activeTab === 'transacoes' ? 'active' : ''}`}
        onClick={() => setActiveTab('transacoes')}
      >
        <ArrowLeftRight size={20} />
        <span>Extrato</span>
      </button>

      {/* Botão Central de Ação Rápida */}
      <button 
        className="bottom-nav-item"
        onClick={() => setIsModalOpen(true)}
        style={{ color: '#fff' }}
        title="Lançamento Rápido"
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0070f3 0%, #00cc88 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 112, 243, 0.35)',
          transform: 'translateY(-2px)'
        }}>
          <Plus size={19} color="#ffffff" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '10px', marginTop: '1px', color: 'var(--ds-foreground-muted)' }}>Novo</span>
      </button>

      <button 
        className={`bottom-nav-item ${activeTab === 'copilot' ? 'active' : ''}`}
        onClick={() => setActiveTab('copilot')}
      >
        <Sparkles size={20} />
        <span>IA Copilot</span>
      </button>

      <button 
        className={`bottom-nav-item ${activeTab === 'orcamentos' ? 'active' : ''}`}
        onClick={() => setActiveTab('orcamentos')}
      >
        <Target size={20} />
        <span>Metas</span>
      </button>
    </nav>
  );
};
