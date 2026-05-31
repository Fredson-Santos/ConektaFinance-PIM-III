import React from 'react';
import { Card } from '../components/ui/Card';

export const Insights = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Card>
        <h3>Insights IA (Em construção)</h3>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>As recomendações inteligentes estão sendo migradas para React.</p>
      </Card>
    </div>
  );
};
