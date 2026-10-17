import React from 'react';
import { 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Sliders, 
  Utensils, 
  Home, 
  Car, 
  Smile, 
  HeartPulse, 
  GraduationCap, 
  Tag 
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const BudgetsView = () => {
  const { gastosPorCategoria, totalDespesas, modoDiscreto } = useFinance();

  const formatCurrency = (val) => {
    if (modoDiscreto) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const tetoTotal = gastosPorCategoria.reduce((acc, c) => acc + (c.limite || 0), 0);
  const percentualTotal = tetoTotal > 0 ? Math.min(Math.round((totalDespesas / tetoTotal) * 100), 100) : 0;
  const saldoRestante = Math.max(0, tetoTotal - totalDespesas);

  const getCategoryIcon = (catName) => {
    switch (catName.toLowerCase()) {
      case 'alimentação': return <Utensils size={18} />;
      case 'moradia': return <Home size={18} />;
      case 'transporte': return <Car size={18} />;
      case 'lazer': return <Smile size={18} />;
      case 'saúde': return <HeartPulse size={18} />;
      case 'educação': return <GraduationCap size={18} />;
      default: return <Tag size={18} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em' }}>
          Orçamentos & Tetos por Categoria
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--ds-foreground-muted)' }}>
          Controle seus limites de gastos mensais e evite extrapolar despesas
        </p>
      </div>

      {/* Visão Geral do Orçamento Total */}
      <div className="ds-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--ds-foreground-muted)' }}>
              Orçamento Mensal Consolidado
            </span>
            <div className="font-mono selectable" style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.03em' }}>
              {formatCurrency(totalDespesas)} <span style={{ fontSize: '18px', color: 'var(--ds-foreground-faint)' }}>/ {formatCurrency(tetoTotal)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--ds-foreground-muted)' }}>Disponível para Gastar</div>
              <div className="font-mono selectable" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--ds-green-700)' }}>
                {formatCurrency(saldoRestante)}
              </div>
            </div>
            <div className="ds-badge ds-badge-blue" style={{ fontSize: '14px', padding: '6px 12px' }}>
              {percentualTotal}% usado
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div style={{
          height: '10px',
          background: 'var(--ds-gray-200)',
          borderRadius: 'var(--ds-radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentualTotal}%`,
            height: '100%',
            background: percentualTotal > 90 ? 'var(--ds-red-700)' : 'linear-gradient(90deg, #0070f3 0%, #00cc88 100%)',
            borderRadius: 'var(--ds-radius-full)',
            transition: 'width 400ms var(--ds-ease)'
          }} />
        </div>
      </div>

      {/* Grid de Cartões de Cada Categoria */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {gastosPorCategoria.map(cat => {
          const saldoCat = Math.max(0, (cat.limite || 0) - cat.totalGasto);
          const isWarning = cat.percentualLimite >= 80 && !cat.ultrapassou;

          return (
            <div key={cat.id} className="ds-card ds-card-interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Top Row: Icon, Name and Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--ds-gray-100)',
                    color: cat.cor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--ds-border)'
                  }}>
                    {getCategoryIcon(cat.nome)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600' }}>{cat.nome}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--ds-foreground-muted)' }}>
                      Teto: {formatCurrency(cat.limite)}
                    </span>
                  </div>
                </div>

                {cat.ultrapassou ? (
                  <span className="ds-badge ds-badge-red" style={{ fontSize: '11px' }}>
                    <AlertTriangle size={12} />
                    Estourado
                  </span>
                ) : isWarning ? (
                  <span className="ds-badge ds-badge-amber" style={{ fontSize: '11px' }}>
                    Alerta 80%
                  </span>
                ) : (
                  <span className="ds-badge ds-badge-green" style={{ fontSize: '11px' }}>
                    <CheckCircle2 size={12} />
                    Dentro
                  </span>
                )}
              </div>

              {/* Middle Row: Progress and Numbers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--ds-foreground-muted)' }}>Gasto realizado</span>
                  <span className="font-mono selectable" style={{ fontWeight: '700', color: cat.ultrapassou ? 'var(--ds-red-700)' : 'var(--ds-foreground)' }}>
                    {formatCurrency(cat.totalGasto)} ({cat.percentualLimite}%)
                  </span>
                </div>

                <div style={{
                  height: '7px',
                  background: 'var(--ds-gray-200)',
                  borderRadius: 'var(--ds-radius-full)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${cat.percentualLimite}%`,
                    height: '100%',
                    background: cat.ultrapassou ? 'var(--ds-red-700)' : cat.cor,
                    borderRadius: 'var(--ds-radius-full)'
                  }} />
                </div>
              </div>

              {/* Bottom Row: Remaining info */}
              <div style={{
                paddingTop: '10px',
                borderTop: '1px solid var(--ds-border)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <span style={{ color: 'var(--ds-foreground-muted)' }}>Saldo disponível:</span>
                <span className="font-mono selectable" style={{ fontWeight: '600', color: cat.ultrapassou ? 'var(--ds-red-700)' : 'var(--ds-green-700)' }}>
                  {cat.ultrapassou ? `Excedeu ${formatCurrency(cat.totalGasto - cat.limite)}` : formatCurrency(saldoCat)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
