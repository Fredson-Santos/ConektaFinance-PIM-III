import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { ExpenseService, CategoryService, Utils } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Gastos = () => {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const itemsPerPage = 10;

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({ amount: '', description: '', categoryId: '', date: new Date().toISOString().split('T')[0], observation: '' });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingExpense(true);
    try {
      await ExpenseService.create({
        value: parseFloat(expenseData.amount),
        description: expenseData.description,
        categoryId: parseInt(expenseData.categoryId),
        transactionDate: new Date(expenseData.date).toISOString(),
        observation: expenseData.observation,
        isRecurrent: false
      });
      showToast('Gasto registrado com sucesso!');
      setIsExpenseModalOpen(false);
      setExpenseData({ amount: '', description: '', categoryId: '', date: new Date().toISOString().split('T')[0], observation: '' });
      loadData();
    } catch (err) {
      showToast('Erro ao registrar gasto', 'error');
    } finally {
      setIsSubmittingExpense(false);
    }
  };
  
  const getMonthRange = () => {
    if (!month) return { startDate: '', endDate: '' };
    const [year, m] = month.split('-');
    const startDate = new Date(year, parseInt(m) - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, parseInt(m), 0).toISOString().split('T')[0];
    return { startDate, endDate };
  };

  const { startDate, endDate } = getMonthRange();

  const filteredExpenses = expenses.filter(e => {
    let matchCategory = true;
    if (selectedCategory) {
      matchCategory = e.categoryId === parseInt(selectedCategory);
    }
    
    let matchDate = true;
    if (month) {
      const dateStr = e.transactionDate || e.date;
      if (!dateStr) return false;
      const d = dateStr.substring(0, 10);
      matchDate = d >= startDate && d <= endDate;
    }
    
    return matchCategory && matchDate;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, catData] = await Promise.all([
        ExpenseService.getAll(),
        CategoryService.getAll()
      ]);
      setExpenses(expData || []);
      setCategories(catData || []);
    } catch (error) {
      showToast('Erro ao carregar gastos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Gastos</h1>
          <p>Gerencie todas as suas despesas</p>
        </div>
        <div className="topbar-right">
          <Button onClick={() => setIsExpenseModalOpen(true)}>+ Novo gasto</Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="table-card">
        <div className="table-header-row">
          <h3 style={{ margin: 0 }}>Histórico de Gastos</h3>
          <div className="table-filters">
            <input 
              type="month" 
              value={month}
              onChange={(e) => { setMonth(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', outline: 'none', color: 'var(--text-main)', fontFamily: 'inherit' }}
            />
            <select 
              value={selectedCategory} 
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', outline: 'none', color: 'var(--text-main)', fontFamily: 'inherit' }}
            >
              <option value="">Todas as categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        ) : (
          <>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Data</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(e => {
                const cat = categories.find(c => c.id === e.categoryId);
                return (
                  <tr key={e.id}>
                    <td data-label="Descrição">{e.description}</td>
                    <td data-label="Categoria">
                      <Badge style={{ background: `${cat?.colorCode || '#333'}22`, color: cat?.colorCode || '#333' }}>
                        {cat?.name || 'Sem Categoria'}
                      </Badge>
                    </td>
                    <td data-label="Data" style={{ color: 'var(--text-muted)' }}>
                      {Utils.formatDate(e.transactionDate || e.date).substring(0, 5)}
                    </td>
                    <td data-label="Valor" className="amount-neg" style={{ textAlign: 'right' }}>
                      −{Utils.formatCurrency(e.value || e.amount)}
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                    Nenhum gasto registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {filteredExpenses.length > itemsPerPage && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} de {filteredExpenses.length} gastos
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  style={{ background: 'var(--white)', color: 'var(--text-main)', border: '1px solid var(--border)', fontSize: '13px', padding: '0.4rem 0.8rem', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Anterior
                </Button>
                <Button 
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredExpenses.length / itemsPerPage), p + 1))} 
                  disabled={currentPage === Math.ceil(filteredExpenses.length / itemsPerPage) || filteredExpenses.length === 0}
                  style={{ background: 'var(--white)', color: 'var(--text-main)', border: '1px solid var(--border)', fontSize: '13px', padding: '0.4rem 0.8rem', opacity: currentPage === Math.ceil(filteredExpenses.length / itemsPerPage) || filteredExpenses.length === 0 ? 0.5 : 1, cursor: currentPage === Math.ceil(filteredExpenses.length / itemsPerPage) || filteredExpenses.length === 0 ? 'not-allowed' : 'pointer' }}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>

      {/* MODAL DE GASTO */}
      <div className={`modal-overlay ${isExpenseModalOpen ? 'active' : ''}`} style={{ display: isExpenseModalOpen ? 'flex' : 'none' }}>
        <div className="modal-content">
          <button className="modal-close" onClick={() => setIsExpenseModalOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="modal-header">
            <h3>Registrar Gasto</h3>
          </div>
          <form onSubmit={handleExpenseSubmit}>
            <div className="field">
              <label>Valor</label>
              <div className="amount-field">
                <span className="prefix">R$</span>
                <input type="number" placeholder="0,00" step="0.01" required value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} />
              </div>
            </div>
            <div className="field">
              <label>Descrição</label>
              <input type="text" placeholder="Ex: Supermercado, Uber..." required value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})} />
            </div>
            <div className="row-two">
              <div className="field">
                <label>Categoria</label>
                <select required value={expenseData.categoryId} onChange={e => setExpenseData({...expenseData, categoryId: e.target.value})}>
                  <option value="">Selecione...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Data</label>
                <input type="date" required value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} />
              </div>
            </div>
            <div className="field">
              <label>Observação (opcional)</label>
              <textarea placeholder="Detalhes adicionais..." value={expenseData.observation} onChange={e => setExpenseData({...expenseData, observation: e.target.value})}></textarea>
            </div>
            <div className="btn-row" style={{marginTop: '1.5rem'}}>
              <button type="button" className="btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={isSubmittingExpense}>
                {isSubmittingExpense ? 'Salvando...' : 'Salvar gasto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
