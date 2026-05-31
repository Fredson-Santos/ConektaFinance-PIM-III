import React, { useEffect, useState } from 'react';
import { AlertService } from '../services/api';
import { useToast } from '../context/ToastContext';

export const Alertas = () => {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await AlertService.getAll();
        setAlerts(data || []);
      } catch (err) {
        showToast('Erro ao carregar alertas', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="alerts-card">
        <h3>Central de Alertas</h3>
        {loading ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>Carregando...</div>
        ) : (
          <div className="alerts-list">
            {alerts.length > 0 ? alerts.map(alert => (
              <div key={alert.id} className={`alert-item ${alert.type === 'Warning' ? 'alert-warn' : alert.type === 'Danger' ? 'alert-danger' : 'alert-ok'}`}>
                <div className="alert-icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="alert-text">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-desc">{alert.message}</div>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-muted)' }}>Você não tem novos alertas.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
