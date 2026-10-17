import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { ReportService, ExpenseService, CategoryService, IncomeService, AlertService, Utils } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const Dashboard = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [lastExpenses, setLastExpenses] = useState([]);
  const [categoryReport, setCategoryReport] = useState([]);
  const [trendReport, setTrendReport] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeData, setIncomeData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [isSubmittingIncome, setIsSubmittingIncome] = useState(false);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({ amount: '', description: '', categoryId: '', date: new Date().toISOString().split('T')[0], observation: '' });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const getMonthRange = () => {
    const [year, m] = month.split('-');
    const startDate = new Date(year, parseInt(m) - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, parseInt(m), 0).toISOString().split('T')[0];
    return { startDate, endDate };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getMonthRange();
      const [sum, catRep, trend, expenses, cats, alertsData] = await Promise.all([
        ReportService.getSummary(startDate, endDate),
        ReportService.getByCategory(startDate, endDate),
        ReportService.getTrend(), // ultimos 6 meses
        ExpenseService.getAll(),
        CategoryService.getAll(),
        AlertService.getAll()
      ]);

      setSummary(sum);
      setCategoryReport(catRep);
      setTrendReport(trend);
      
      // Filtra os gastos para exibir apenas os do mês selecionado
      const filteredExpenses = expenses.filter(e => {
        const dateStr = e.transactionDate || e.date;
        if (!dateStr) return false;
        const d = dateStr.substring(0, 10);
        return d >= startDate && d <= endDate;
      });
      setLastExpenses(filteredExpenses);
      
      setCategories(cats);
      setAlerts(alertsData || []);
    } catch (error) {
      showToast('Erro ao carregar dados do dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingIncome(true);
    try {
      await IncomeService.create({
        amount: parseFloat(incomeData.amount),
        description: incomeData.description,
        transactionDate: new Date(incomeData.date).toISOString()
      });
      showToast('Entrada adicionada com sucesso!');
      setIsIncomeModalOpen(false);
      setIncomeData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err) {
      showToast('Erro ao adicionar entrada', 'error');
    } finally {
      setIsSubmittingIncome(false);
    }
  };

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

  // Transform Data for Recharts
  const trendData = trendReport?.length > 0 
    ? [...trendReport]
        .map(t => ({ period: t.period, value: t.value || t.amount || 0 }))
        .sort((a, b) => {
          if (!a.period || !b.period) return 0;
          const partsA = a.period.split('/');
          const partsB = b.period.split('/');
          if (partsA.length === 2 && partsB.length === 2) {
            return new Date(partsA[1], partsA[0] - 1) - new Date(partsB[1], partsB[0] - 1);
          }
          return 0;
        })
    : [
        { period: 'Jan', value: 0 },
        { period: 'Fev', value: 0 },
        { period: 'Mar', value: 0 },
        { period: 'Abr', value: 0 },
        { period: 'Mai', value: summary?.totalSpent || 0 }
      ];

  const pieData = categoryReport?.filter(c => c.totalSpent > 0).map(c => {
    const catObj = categories.find(cat => cat.id === c.categoryId);
    return {
      name: c.categoryName,
      value: c.totalSpent,
      color: catObj ? (catObj.colorCode || catObj.colorHex || '#3B6D11') : '#3B6D11'
    };
  }) || [];

  if (pieData.length === 0) {
    pieData.push({ name: 'Sem gastos', value: 1, color: '#e0e0e0' });
  }

  const renderKPIs = () => {
    if (!summary) return null;

    return (
      <div className="cards-grid">
        <Card accent={summary.remainingBudget >= 0 ? 'blue' : 'red'}>
          <div className="mc-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Saldo restante
          </div>
          <div className="mc-value">{Utils.formatCurrency(summary.remainingBudget)}</div>
          <div className="mc-sub">de {Utils.formatCurrency(summary.totalBudget)} do orçamento</div>
        </Card>

        <Card>
          <div className="mc-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Total gasto
          </div>
          <div className="mc-value">{Utils.formatCurrency(summary.totalSpent)}</div>
          <div className="mc-sub up">{summary.totalSpent > 0 ? '+0% vs mês anterior' : 'sem gastos'}</div>
        </Card>

        <Card>
          <div className="mc-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18l-2 13H5L3 6z"/></svg>
            Gastos registrados
          </div>
          <div className="mc-value">{lastExpenses?.length || 0}</div>
          <div className="mc-sub ok">
             {lastExpenses?.length > 0 ? `em ${new Set(lastExpenses.map(e => e.categoryId)).size} categorias` : 'nenhum gasto'}
          </div>
        </Card>

        <Card>
          <div className="mc-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Maior gasto
          </div>
          <div className="mc-value">{summary.largestExpense ? Utils.formatCurrency(summary.largestExpense.amount) : 'R$ 0,00'}</div>
          <div className="mc-sub warn">{summary.largestExpense ? summary.largestExpense.description : 'sem dados'}</div>
        </Card>
      </div>
    );
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Dashboard</h1>
          <p>Visão geral das suas finanças</p>
        </div>
        <div className="topbar-right">
          <input 
            type="month" 
            className="month-select" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ fontFamily:'DM Sans', fontSize:'13px', fontWeight:500, color:'var(--text-muted)', background:'var(--white)', border:'1px solid var(--border)', borderRadius:'8px', padding:'0.45rem 0.8rem', cursor:'pointer', outline:'none', height:'38px' }} 
          />
          <Button style={{background:'#3B6D11', borderColor:'#3B6D11'}} onClick={() => setIsIncomeModalOpen(true)}>+ Nova entrada</Button>
          <Button style={{background:'#E24B4A', borderColor:'#E24B4A'}} onClick={() => setIsExpenseModalOpen(true)}>+ Novo gasto</Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando dados...</div>
        ) : (
          <>
            {renderKPIs()}

            <div className="charts-row">
              <div className="chart-card">
                <h3>Evolução dos gastos — últimos 6 meses</h3>
                <div className="chart-canvas-wrap" style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B6D11" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3B6D11" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(val) => `R$ ${val}`} />
                      <Tooltip formatter={(value) => Utils.formatCurrency(value)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '13px' }} />
                      <Area type="monotone" dataKey="value" stroke="#3B6D11" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 6, fill: '#3B6D11', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="chart-card">
                <h3>Distribuição por categoria</h3>
                <div className="chart-canvas-wrap" style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => Utils.formatCurrency(value)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '13px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bottom-row">
              <div className="table-card">
                <h3>Últimos gastos <a href="#">Ver todos →</a></h3>
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Data</th>
                      <th style={{textAlign:'right'}}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastExpenses?.slice(0, 5).map(e => {
                      const cat = categories.find(c => c.id === e.categoryId);
                      return (
                        <tr key={e.id}>
                          <td data-label="Descrição">{e.description}</td>
                          <td data-label="Categoria">
                             <Badge style={{ background: `${cat?.colorCode || '#333'}22`, color: cat?.colorCode || '#333' }}>
                               {cat?.name || 'Sem Categoria'}
                             </Badge>
                          </td>
                          <td data-label="Data" style={{color:'var(--text-muted)'}}>{Utils.formatDate(e.transactionDate || e.date).substring(0, 5)}</td>
                          <td data-label="Valor" className="amount-neg" style={{textAlign:'right'}}>−{Utils.formatCurrency(e.value || e.amount)}</td>
                        </tr>
                      )
                    })}
                    {!lastExpenses?.length && (
                      <tr><td colSpan="4" style={{textAlign:'center', padding:'1rem', color:'var(--text-muted)'}}>Nenhum gasto neste período.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>
                <div className="chart-card" style={{flex:1}}>
                  <h3>Orçamento por categoria</h3>
                  <div className="budget-list">
                    {categoryReport?.filter(c => c.budgetLimit > 0).map(c => {
                      let fillClass = 'fill-ok';
                      if (c.percentageUsed > 100) fillClass = 'fill-over';
                      else if (c.percentageUsed > 80) fillClass = 'fill-warn';

                      return (
                        <div className="budget-item" key={c.categoryId}>
                          <div className="budget-row">
                            <span className="budget-cat">{c.categoryName}</span>
                            <span className="budget-values">{Utils.formatCurrency(c.totalSpent)} / {Utils.formatCurrency(c.budgetLimit)}</span>
                          </div>
                          <div className="progress-bar">
                            <div className={`progress-fill ${fillClass}`} style={{width: `${Math.min(c.percentageUsed, 100)}%`}}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE ENTRADA */}
      <div className={`modal-overlay ${isIncomeModalOpen ? 'active' : ''}`} style={{ display: isIncomeModalOpen ? 'flex' : 'none' }}>
        <div className="modal-content">
          <button className="modal-close" onClick={() => setIsIncomeModalOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="modal-header">
            <h3>Adicionar Entrada ao Saldo</h3>
          </div>
          <form onSubmit={handleIncomeSubmit}>
            <div className="field">
              <label>Valor da Entrada</label>
              <div className="amount-field">
                <span className="prefix">R$</span>
                <input type="number" placeholder="0,00" step="0.01" required value={incomeData.amount} onChange={e => setIncomeData({...incomeData, amount: e.target.value})} />
              </div>
            </div>
            <div className="field">
              <label>Descrição</label>
              <input type="text" placeholder="Ex: Salário, Freela, Depósito..." required value={incomeData.description} onChange={e => setIncomeData({...incomeData, description: e.target.value})} />
            </div>
            <div className="field">
              <label>Data</label>
              <input type="date" required value={incomeData.date} onChange={e => setIncomeData({...incomeData, date: e.target.value})} />
            </div>
            <div className="btn-row" style={{marginTop: '1.5rem'}}>
              <button type="button" className="btn-secondary" onClick={() => setIsIncomeModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{background:'#3B6D11'}} disabled={isSubmittingIncome}>
                {isSubmittingIncome ? 'Adicionando...' : 'Confirmar Entrada'}
              </button>
            </div>
          </form>
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
