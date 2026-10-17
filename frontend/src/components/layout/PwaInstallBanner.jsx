import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2 } from 'lucide-react';

export const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Verifica se já está rodando em modo standalone (PWA instalado)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Para instalar no iOS: toque no botão Compartilhar do Safari e selecione 'Adicionar à Tela de Início'. No Chrome Desktop: clique no ícone de instalação na barra de endereço.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Se já estiver instalado em modo autônomo (standalone) ou fechado pelo usuário, oculta
  if (isInstalled || !isVisible) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(0, 112, 243, 0.12) 0%, rgba(0, 204, 136, 0.12) 100%)',
      border: '1px solid rgba(0, 112, 243, 0.25)',
      borderRadius: 'var(--ds-radius-lg)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      boxShadow: 'var(--ds-shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--ds-blue-alpha-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isInstalled ? (
            <CheckCircle2 size={18} color="var(--ds-green-700)" />
          ) : (
            <Smartphone size={18} color="var(--ds-blue-700)" />
          )}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ds-foreground)' }}>
            {isInstalled ? "Aplicativo PWA Instalado" : "Instale o App no Smartphone"}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ds-foreground-muted)' }}>
            {isInstalled
              ? "Você está utilizando a versão autônoma com cache e suporte offline."
              : "Adicione à tela inicial para tela cheia e controle sem internet."}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isInstalled && (
          <button
            className="ds-btn ds-btn-blue"
            onClick={handleInstallClick}
            style={{ height: '34px', padding: '0 12px', fontSize: '12px' }}
          >
            <Download size={14} />
            <span>Instalar PWA</span>
          </button>
        )}
        <button
          className="ds-btn ds-btn-ghost ds-btn-icon"
          onClick={() => setIsVisible(false)}
          style={{ width: '32px', height: '32px' }}
          aria-label="Fechar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
