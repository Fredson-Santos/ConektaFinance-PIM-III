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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '-4rem' }}>
         <Button>+ Novo gasto</Button>
      </div>

      <div className="table-card">
        <h3>Histórico de Gastos</h3>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        ) : (
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
              {expenses.map(e => {
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
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                    Nenhum gasto registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
