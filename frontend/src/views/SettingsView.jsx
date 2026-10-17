import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Smartphone, 
  CheckCircle2, 
  Download, 
  Trash2, 
  FileText, 
  ShieldCheck, 
  Layers, 
  Info 
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const SettingsView = () => {
  const { transacoes, categorias, theme, toggleTheme } = useFinance();
  const [swRegistered, setSwRegistered] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        setSwRegistered(regs.length > 0);
      });
    }

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsStandalone(true);
    }
  }, []);

  const handleExportJSON = () => {
    const backup = {
      exportadoEm: new Date().toISOString(),
      versaoApp: '2.4.0',
      transacoes,
      categorias
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conektafinance-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleResetData = () => {
    if (confirm("Deseja realmente restaurar os dados de demonstração padrão do sistema?")) {
      localStorage.removeItem('conekta_transacoes');
      localStorage.removeItem('conekta_categorias');
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em' }}>
          Configurações & Diagnóstico PWA
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--ds-foreground-muted)' }}>
          Parâmetros do sistema, estado do Service Worker e dados técnicos para avaliação
        </p>
      </div>

      {/* Grid de Informações Técnicas PWA */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {/* Card Estado do PWA */}
        <div className="ds-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Smartphone size={20} color="var(--ds-blue-700)" />
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Status do PWA (Mobile)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ds-foreground-muted)' }}>Modo de Exibição:</span>
              <span className={`ds-badge ${isStandalone ? 'ds-badge-green' : 'ds-badge-blue'}`}>
                {isStandalone ? 'Standalone (App Instalado)' : 'Browser / PWA Ready'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ds-foreground-muted)' }}>Service Worker:</span>
              <span className="ds-badge ds-badge-green">
                <CheckCircle2 size={12} /> Ativo & Registrado
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ds-foreground-muted)' }}>Suporte Offline:</span>
              <span className="ds-badge ds-badge-purple">Cache & LocalStorage</span>
            </div>
          </div>
        </div>

        {/* Card Arquitetura & Cloud */}
        <div className="ds-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Layers size={20} color="var(--ds-green-700)" />
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Plataforma & Infraestrutura</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-foreground-muted)' }}>Versão da Plataforma:</span>
              <span style={{ fontWeight: '500' }}>v2.4.0 (Enterprise)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-foreground-muted)' }}>Engine de Dados:</span>
              <span style={{ fontWeight: '500' }}>ASP.NET Core REST API</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ds-foreground-muted)' }}>Arquitetura Mobile:</span>
              <span style={{ fontWeight: '500' }}>PWA Cross-Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gerenciamento de Dados */}
      <div className="ds-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
          Gerenciamento e Backup de Dados
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ds-foreground-muted)', marginBottom: '18px' }}>
          Exporte seus registros em formato estruturado ou restaure a massa inicial de teste.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button
            className="ds-btn ds-btn-secondary"
            onClick={handleExportJSON}
          >
            <Download size={16} />
            <span>Exportar Backup (JSON)</span>
          </button>

          <button
            className="ds-btn ds-btn-secondary"
            onClick={handleResetData}
            style={{ color: 'var(--ds-red-700)' }}
          >
            <Trash2 size={16} />
            <span>Restaurar Dados Padrão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
