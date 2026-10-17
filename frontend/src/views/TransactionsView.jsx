import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpDown,
  Calendar
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const TransactionsView = () => {
  const { 
    transacoes, 
    removerTransacao, 
    categorias, 
    modoDiscreto, 
    setIsModalOpen 
  } = useFinance();

  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos'); // 'todos', 'despesa', 'receita'
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  const formatCurrency = (val) => {
    if (modoDiscreto) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter(t => {
      const matchBusca = t.descricao.toLowerCase().includes(busca.toLowerCase());
      const matchTipo = tipoFiltro === 'todos' || t.tipo === tipoFiltro;
      const matchCategoria = categoriaFiltro === 'todas' || t.categoria.toLowerCase() === categoriaFiltro.toLowerCase();
      return matchBusca && matchTipo && matchCategoria;
    });
  }, [transacoes, busca, tipoFiltro, categoriaFiltro]);

  const totalFiltrado = transacoesFiltradas.reduce((acc, curr) => {
    return curr.tipo === 'receita' ? acc + Number(curr.valor) : acc - Number(curr.valor);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header com Título e Ação */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em' }}>
            Extrato de Transações
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ds-foreground-muted)' }}>
            Gerencie e filtre todos os seus lançamentos financeiros
          </p>
        </div>

        <button 
          className="ds-btn ds-btn-blue"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="ds-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {/* Campo de Busca */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-foreground-muted)' }} />
          <input 
            type="text"
            placeholder="Buscar por descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="ds-input selectable"
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        {/* Filtro Tipo */}
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="ds-input"
          style={{ width: 'auto', minWidth: '130px', height: '40px' }}
        >
          <option value="todos">Todos os Tipos</option>
          <option value="despesa">Apenas Despesas</option>
          <option value="receita">Apenas Receitas</option>
        </select>

        {/* Filtro Categoria */}
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="ds-input"
          style={{ width: 'auto', minWidth: '150px', height: '40px' }}
        >
          <option value="todas">Todas Categorias</option>
          {categorias.map(c => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
          <option value="Salário">Salário</option>
          <option value="Investimentos/Extra">Investimentos/Extra</option>
        </select>

        {/* Resumo Rápido dos Filtros */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ds-foreground-muted)' }}>Total Filtrado:</span>
          <span className="font-mono selectable" style={{
            fontSize: '14px',
            fontWeight: '700',
            color: totalFiltrado >= 0 ? 'var(--ds-green-700)' : 'var(--ds-red-700)'
          }}>
            {formatCurrency(totalFiltrado)}
          </span>
        </div>
      </div>

      {/* Lista / Tabela de Transações */}
      <div className="ds-card" style={{ padding: '0', overflow: 'hidden' }}>
        {transacoesFiltradas.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ds-foreground-muted)' }}>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>Nenhuma transação encontrada para os filtros aplicados.</p>
            <button className="ds-btn ds-btn-secondary" onClick={() => { setBusca(''); setTipoFiltro('todos'); setCategoriaFiltro('todas'); }}>
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transacoesFiltradas.map((t, idx) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: idx === transacoesFiltradas.length - 1 ? 'none' : '1px solid var(--ds-border)',
                  background: 'transparent',
                  transition: 'background var(--ds-duration-fast) var(--ds-ease)'
                }}
              >
                {/* Lado Esquerdo: Ícone + Descrição */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: t.tipo === 'receita' ? 'var(--ds-green-alpha-200)' : 'var(--ds-red-alpha-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {t.tipo === 'receita' ? (
                      <TrendingUp size={18} color="var(--ds-green-700)" />
                    ) : (
                      <TrendingDown size={18} color="var(--ds-red-700)" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ds-foreground)' }}>
                      {t.descricao}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span className="ds-badge ds-badge-gray" style={{ fontSize: '11px', padding: '2px 6px' }}>
                        {t.categoria}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ds-foreground-faint)' }}>
                        {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Valor + Ação */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="font-mono selectable" style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    textAlign: 'right',
                    color: t.tipo === 'receita' ? 'var(--ds-green-700)' : 'var(--ds-red-700)'
                  }}>
                    {t.tipo === 'receita' ? '+' : '-'} {formatCurrency(t.valor)}
                  </div>

                  <button
                    className="ds-btn ds-btn-ghost ds-btn-icon"
                    onClick={() => removerTransacao(t.id)}
                    title="Excluir Transação"
                    style={{ width: '32px', height: '32px', color: 'var(--ds-foreground-muted)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
