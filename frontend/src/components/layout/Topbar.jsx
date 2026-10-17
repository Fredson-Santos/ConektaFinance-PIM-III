import React from 'react';
import { 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  Plus 
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const Topbar = () => {
  const { 
    theme, 
    toggleTheme, 
    modoDiscreto, 
    setModoDiscreto, 
    setIsModalOpen 
  } = useFinance();

  return (
    <header className="app-topbar">
      {/* Brand & Mobile Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--ds-radius-md)',
          background: 'var(--ds-foreground)',
          color: 'var(--ds-foreground-contrast)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '15px',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          flexShrink: 0
        }}>
          C
        </div>
        <div>
          <h1 style={{ 
            fontSize: '15.5px', 
            fontWeight: '600', 
            letterSpacing: '-0.02em', 
            lineHeight: '1.2',
            color: 'var(--ds-foreground)'
          }}>
            Conekta<span style={{ color: 'var(--ds-blue-700)' }}>Finance</span>
          </h1>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Modo Discreto (Privacidade no Mobile) */}
        <button
          className="ds-btn ds-btn-secondary ds-btn-icon"
          onClick={() => setModoDiscreto(!modoDiscreto)}
          title={modoDiscreto ? "Exibir valores" : "Ocultar valores (Modo Discreto)"}
          aria-label="Modo Discreto"
          style={{ width: '34px', height: '34px' }}
        >
          {modoDiscreto ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>

        {/* Tema Dark / Light */}
        <button
          className="ds-btn ds-btn-secondary ds-btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          aria-label="Alternar Tema"
          style={{ width: '34px', height: '34px' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Botão de Adição Rápida (Desktop apenas, já que mobile usa o botão central da BottomNav) */}
        <button
          className="ds-btn ds-btn-blue btn-desktop-only"
          onClick={() => setIsModalOpen(true)}
          style={{ height: '34px', padding: '0 14px', fontSize: '13px' }}
        >
          <Plus size={15} />
          <span>Nova Despesa</span>
        </button>
      </div>
    </header>
  );
};
