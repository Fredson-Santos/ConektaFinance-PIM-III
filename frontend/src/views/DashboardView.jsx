import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ArrowRight,
  Sparkles,
  Utensils,
  Home,
  Car,
  Smile,
  HeartPulse,
  GraduationCap,
  Tag
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { PwaInstallBanner } from '../components/layout/PwaInstallBanner';

export const DashboardView = () => {
  const { 
    totalReceitas, 
    totalDespesas, 
    saldoAtual, 
    modoDiscreto, 
    transacoes, 
    gastosPorCategoria,
    setActiveTab
  } = useFinance();

  const formatCurrency = (val) => {
    if (modoDiscreto) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const taxaPoupanca = totalReceitas > 0 ? Math.max(0, Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100)) : 0;

  const getCategoryIcon = (catName) => {
    switch (catName.toLowerCase()) {
      case 'alimentação': return <Utensils size={15} />;
      case 'moradia': return <Home size={15} />;
      case 'transporte': return <Car size={15} />;
      case 'lazer': return <Smile size={15} />;
      case 'saúde': return <HeartPulse size={15} />;
      case 'educação': return <GraduationCap size={15} />;
      default: return <Tag size={15} />;
    }
  };

  const ultimasTransacoes = transacoes.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* PWA Install Alert Banner */}
      <PwaInstallBanner />

      {/* Grid de Métricas Principais (Responsivo Mobile 2-colunas e Desktop 4-colunas) */}
      <div 
        className="mobile-metrics-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}
      >
        {/* Saldo Líquido (Hero Card) */}
        <div className="ds-card metric-card-hero" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--ds-foreground-muted)' }}>
              Saldo Disponível
            </span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--ds-radius-md)',
              background: 'var(--ds-blue-alpha-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={15} color="var(--ds-blue-700)" />
            </div>
          </div>
          <div className="font-mono selectable" style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: saldoAtual >= 0 ? 'var(--ds-foreground)' : 'var(--ds-red-700)' }}>
            {formatCurrency(saldoAtual)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span className={`ds-badge ${saldoAtual >= 0 ? 'ds-badge-green' : 'ds-badge-red'}`} style={{ fontSize: '11px' }}>
              {saldoAtual >= 0 ? '+ Positivo' : 'Déficit'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ds-foreground-faint)' }}>Ciclo mensal</span>
          </div>
        </div>

        {/* Total Receitas */}
        <div className="ds-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ds-foreground-muted)' }}>
              Receitas
            </span>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--ds-radius-sm)',
              background: 'var(--ds-green-alpha-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={14} color="var(--ds-green-700)" />
            </div>
          </div>
          <div className="font-mono selectable" style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--ds-green-700)' }}>
            {formatCurrency(totalReceitas)}
          </div>
          <span className="ds-badge ds-badge-green" style={{ fontSize: '10.5px', marginTop: '6px' }}>Entradas</span>
        </div>

        {/* Total Despesas */}
        <div className="ds-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ds-foreground-muted)' }}>
              Despesas
            </span>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--ds-radius-sm)',
              background: 'var(--ds-red-alpha-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingDown size={14} color="var(--ds-red-700)" />
            </div>
          </div>
          <div className="font-mono selectable" style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--ds-red-700)' }}>
            {formatCurrency(totalDespesas)}
          </div>
          <span className="ds-badge ds-badge-red" style={{ fontSize: '10.5px', marginTop: '6px' }}>Saídas</span>
        </div>

        {/* Taxa de Reserva */}
        <div className="ds-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ds-foreground-muted)' }}>
              Reserva
            </span>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--ds-radius-sm)',
              background: 'var(--ds-purple-alpha-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PiggyBank size={14} color="var(--ds-purple-700)" />
            </div>
          </div>
          <div className="font-mono selectable" style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {taxaPoupanca}%
          </div>
          <span className="ds-badge ds-badge-purple" style={{ fontSize: '10.5px', marginTop: '6px' }}>Poupado</span>
        </div>
      </div>

      {/* Copilot AI Quick Insight Banner */}
      <div className="ds-card" style={{
        padding: '16px 18px',
        background: 'linear-gradient(135deg, rgba(0, 112, 243, 0.08) 0%, rgba(142, 78, 198, 0.08) 100%)',
        borderColor: 'rgba(0, 112, 243, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--ds-radius-lg)',
            background: 'linear-gradient(135deg, #0070f3 0%, #8e4ec6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0, 112, 243, 0.3)',
            flexShrink: 0
          }}>
            <Sparkles size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--ds-foreground)' }}>
              Copilot Conekta IA
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ds-foreground-muted)', lineHeight: '1.4' }}>
              Seu orçamento geral está 58% utilizado. Atenção especial com Moradia e Alimentação.
            </div>
          </div>
        </div>

        <button 
          className="ds-btn ds-btn-secondary"
          onClick={() => setActiveTab('copilot')}
          style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
        >
          <span>Abrir Copilot</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Two Column Grid: Budget Categories & Recent Transactions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '18px'
      }}>
        {/* Orçamentos por Categoria */}
        <div className="ds-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '-0.02em' }}>
                Metas & Limites de Categoria
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--ds-foreground-muted)' }}>
                Acompanhamento em tempo real contra o teto
              </p>
            </div>
            <button 
              className="ds-btn ds-btn-ghost" 
              onClick={() => setActiveTab('orcamentos')}
              style={{ fontSize: '11.5px', padding: '4px 8px', height: '28px' }}
            >
              Ver todas
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {gastosPorCategoria.slice(0, 5).map(cat => (
              <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: '500' }}>
                    <span style={{ color: cat.cor }}>{getCategoryIcon(cat.nome)}</span>
                    <span>{cat.nome}</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: '11.5px' }}>
                    <span style={{ fontWeight: '600', color: cat.ultrapassou ? 'var(--ds-red-700)' : 'var(--ds-foreground)' }}>
                      {formatCurrency(cat.totalGasto)}
                    </span>
                    <span style={{ color: 'var(--ds-foreground-faint)' }}> / {formatCurrency(cat.limite)}</span>
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div style={{
                  height: '5px',
                  background: 'var(--ds-gray-200)',
                  borderRadius: 'var(--ds-radius-full)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${cat.percentualLimite}%`,
                    height: '100%',
                    background: cat.ultrapassou ? 'var(--ds-red-700)' : cat.cor,
                    borderRadius: 'var(--ds-radius-full)',
                    transition: 'width 300ms var(--ds-ease)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas Transações */}
        <div className="ds-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '-0.02em' }}>
                Últimas Movimentações
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--ds-foreground-muted)' }}>
                Lançamentos recentes da conta
              </p>
            </div>
            <button 
              className="ds-btn ds-btn-ghost" 
              onClick={() => setActiveTab('transacoes')}
              style={{ fontSize: '11.5px', padding: '4px 8px', height: '28px' }}
            >
              Extrato completo
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ultimasTransacoes.map(t => (
              <div 
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: 'var(--ds-background-200)',
                  borderRadius: 'var(--ds-radius-md)',
                  border: '1px solid var(--ds-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--ds-radius-sm)',
                    background: t.tipo === 'receita' ? 'var(--ds-green-alpha-200)' : 'var(--ds-red-alpha-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {t.tipo === 'receita' ? (
                      <TrendingUp size={15} color="var(--ds-green-700)" />
                    ) : (
                      <TrendingDown size={15} color="var(--ds-red-700)" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{t.descricao}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ds-foreground-faint)' }}>
                      {t.categoria} • {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="font-mono" style={{
                  fontSize: '13.5px',
                  fontWeight: '700',
                  color: t.tipo === 'receita' ? 'var(--ds-green-700)' : 'var(--ds-red-700)'
                }}>
                  {t.tipo === 'receita' ? '+' : '-'} {formatCurrency(t.valor)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
