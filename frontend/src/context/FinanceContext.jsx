import React, { createContext, useContext, useState, useEffect } from 'react';

const FinanceContext = createContext();

const INITIAL_CATEGORIES = [
  { id: '1', nome: 'Alimentação', cor: 'var(--ds-red-700)', icone: 'Utensils', limite: 1200 },
  { id: '2', nome: 'Moradia', cor: 'var(--ds-amber-700)', icone: 'Home', limite: 1800 },
  { id: '3', nome: 'Transporte', cor: 'var(--ds-blue-700)', icone: 'Car', limite: 600 },
  { id: '4', nome: 'Lazer', cor: 'var(--ds-green-700)', icone: 'Smile', limite: 500 },
  { id: '5', nome: 'Saúde', cor: 'var(--ds-teal-700)', icone: 'HeartPulse', limite: 400 },
  { id: '6', nome: 'Educação', cor: 'var(--ds-purple-700)', icone: 'GraduationCap', limite: 450 },
  { id: '7', nome: 'Outros', cor: 'var(--ds-gray-600)', icone: 'Tag', limite: 300 }
];

const INITIAL_TRANSACTIONS = [
  { id: '1', tipo: 'receita', descricao: 'Salário Tech Solutions', valor: 6500.00, categoria: 'Salário', data: '2026-10-05', status: 'concluido' },
  { id: '2', tipo: 'receita', descricao: 'Freelance Design UI/UX', valor: 1200.00, categoria: 'Investimentos/Extra', data: '2026-10-12', status: 'concluido' },
  { id: '3', tipo: 'despesa', descricao: 'Aluguel do Apartamento', valor: 1450.00, categoria: 'Moradia', data: '2026-10-08', status: 'concluido' },
  { id: '4', tipo: 'despesa', descricao: 'Supermercado Mensal', valor: 780.50, categoria: 'Alimentação', data: '2026-10-10', status: 'concluido' },
  { id: '5', tipo: 'despesa', descricao: 'iFood & Jantar Especial', valor: 165.90, categoria: 'Alimentação', data: '2026-10-14', status: 'concluido' },
  { id: '6', tipo: 'despesa', descricao: 'Combustível / Posto Shell', valor: 220.00, categoria: 'Transporte', data: '2026-10-15', status: 'concluido' },
  { id: '7', tipo: 'despesa', descricao: 'Farmácia & Vitaminas', valor: 142.30, categoria: 'Saúde', data: '2026-10-16', status: 'concluido' },
  { id: '8', tipo: 'despesa', descricao: 'Curso Online Cloud & DevOps', valor: 189.90, categoria: 'Educação', data: '2026-10-16', status: 'concluido' },
  { id: '9', tipo: 'despesa', descricao: 'Ingressos Cinema & Lazer', valor: 95.00, categoria: 'Lazer', data: '2026-10-17', status: 'concluido' }
];

export const FinanceProvider = ({ children }) => {
  const [transacoes, setTransacoes] = useState(() => {
    const saved = localStorage.getItem('conekta_transacoes');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [categorias, setCategorias] = useState(() => {
    const saved = localStorage.getItem('conekta_categorias');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('conekta_theme');
    return saved || 'dark';
  });

  const [modoDiscreto, setModoDiscreto] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'transacoes', 'orcamentos', 'copilot', 'configuracoes'
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('conekta_transacoes', JSON.stringify(transacoes));
  }, [transacoes]);

  useEffect(() => {
    localStorage.setItem('conekta_categorias', JSON.stringify(categorias));
  }, [categorias]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('conekta_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const adicionarTransacao = (novaTransacao) => {
    const item = {
      ...novaTransacao,
      id: Date.now().toString(),
      data: novaTransacao.data || new Date().toISOString().split('T')[0],
      status: 'concluido'
    };
    setTransacoes(prev => [item, ...prev]);
  };

  const removerTransacao = (id) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
  };

  // Cálculos consolidados
  const totalReceitas = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((acc, curr) => acc + Number(curr.valor), 0);

  const totalDespesas = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((acc, curr) => acc + Number(curr.valor), 0);

  const saldoAtual = totalReceitas - totalDespesas;

  // Gastos por categoria
  const gastosPorCategoria = categorias.map(cat => {
    const totalGasto = transacoes
      .filter(t => t.tipo === 'despesa' && t.categoria.toLowerCase() === cat.nome.toLowerCase())
      .reduce((acc, curr) => acc + Number(curr.valor), 0);
    const percentualLimite = cat.limite ? Math.min(Math.round((totalGasto / cat.limite) * 100), 100) : 0;
    const ultrapassou = cat.limite ? totalGasto > cat.limite : false;
    return {
      ...cat,
      totalGasto,
      percentualLimite,
      ultrapassou
    };
  });

  return (
    <FinanceContext.Provider
      value={{
        transacoes,
        categorias,
        gastosPorCategoria,
        totalReceitas,
        totalDespesas,
        saldoAtual,
        adicionarTransacao,
        removerTransacao,
        theme,
        toggleTheme,
        modoDiscreto,
        setModoDiscreto,
        activeTab,
        setActiveTab,
        isModalOpen,
        setIsModalOpen
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
