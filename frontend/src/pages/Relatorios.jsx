import React from 'react';
import { Card } from '../components/ui/Card';

export const Relatorios = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Card>
        <h3>Em construção</h3>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>A tela de relatórios está sendo migrada para React.</p>
      </Card>
    </div>
  );
};
