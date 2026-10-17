import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const TransactionModal = () => {
  const { isModalOpen, setIsModalOpen, categorias, adicionarTransacao } = useFinance();

  const [tipo, setTipo] = useState('despesa');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]?.nome || 'Alimentação');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  if (!isModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!descricao.trim() || !valor || Number(valor) <= 0) {
      alert("Por favor, preencha uma descrição e um valor válido.");
      return;
    }

    adicionarTransacao({
      tipo,
      descricao: descricao.trim(),
      valor: parseFloat(valor),
      categoria: tipo === 'receita' ? 'Salário/Entrada' : categoria,
      data
    });

    // Reset e fecha
    setDescricao('');
    setValor('');
    setIsModalOpen(false);
  };

  return (
    <div className="ds-modal-overlay" onClick={() => setIsModalOpen(false)}>
      <div className="ds-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ds-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.02em' }}>
              Novo Lançamento
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--ds-foreground-muted)' }}>
              Registre uma movimentação no seu controle
            </span>
          </div>
          <button
            className="ds-btn ds-btn-ghost ds-btn-icon"
            onClick={() => setIsModalOpen(false)}
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Segmented Control Tipo (Despesa vs Receita) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--ds-gray-100)',
            padding: '4px',
            borderRadius: 'var(--ds-radius-lg)',
            border: '1px solid var(--ds-border)',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setTipo('despesa')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--ds-radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all var(--ds-duration-fast) var(--ds-ease)',
                background: tipo === 'despesa' ? 'var(--ds-red-alpha-200)' : 'transparent',
                color: tipo === 'despesa' ? 'var(--ds-red-700)' : 'var(--ds-foreground-muted)',
                outline: tipo === 'despesa' ? '1px solid rgba(229, 72, 77, 0.3)' : 'none'
              }}
            >
              <ArrowDownRight size={16} />
              <span>Despesa</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('receita')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--ds-radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all var(--ds-duration-fast) var(--ds-ease)',
                background: tipo === 'receita' ? 'var(--ds-green-alpha-200)' : 'transparent',
                color: tipo === 'receita' ? 'var(--ds-green-700)' : 'var(--ds-foreground-muted)',
                outline: tipo === 'receita' ? '1px solid rgba(0, 204, 136, 0.3)' : 'none'
              }}
            >
              <ArrowUpRight size={16} />
              <span>Receita</span>
            </button>
          </div>

          {/* Valor Input */}
          <div className="ds-form-group">
            <label className="ds-label">Valor (R$)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ds-foreground-muted)',
                fontWeight: '600',
                fontSize: '15px',
                fontFamily: 'var(--font-mono)'
              }}>
                R$
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="ds-input font-mono selectable"
                style={{ paddingLeft: '44px', fontSize: '18px', fontWeight: '600' }}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Descrição Input */}
          <div className="ds-form-group">
            <label className="ds-label">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Supermercado, Aluguel, Salário..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="ds-input selectable"
              required
            />
          </div>

          {/* Categoria Select (se for despesa) */}
          {tipo === 'despesa' && (
            <div className="ds-form-group">
              <label className="ds-label">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="ds-input"
                style={{ cursor: 'pointer' }}
              >
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.nome}>
                    {cat.nome} (Limite: R$ {cat.limite ? cat.limite.toFixed(2) : 'Sem limite'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Data */}
          <div className="ds-form-group">
            <label className="ds-label">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="ds-input font-mono selectable"
              required
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={() => setIsModalOpen(false)}
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`ds-btn ${tipo === 'despesa' ? 'ds-btn-blue' : 'ds-btn-primary'}`}
              style={{ flex: 2 }}
            >
              <Check size={16} />
              <span>Salvar Lançamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
