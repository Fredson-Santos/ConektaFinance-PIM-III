import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { ReportService, CategoryService, Utils } from '../services/api';
import { Card } from '../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Relatorios = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const getMonthRange = () => {
    if (!month) return { startDate: '', endDate: '' };
    const [year, m] = month.split('-');
    const startDate = new Date(year, parseInt(m) - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, parseInt(m), 0).toISOString().split('T')[0];
    return { startDate, endDate };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getMonthRange();
      const [sum, daily, catRep, cats] = await Promise.all([
        ReportService.getSummary(startDate, endDate),
        ReportService.getDaily(startDate, endDate),
        ReportService.getByCategory(startDate, endDate),
        CategoryService.getAll()
      ]);

      setSummary(sum);
      setDailyData(daily || []);
      setCategoryData(catRep || []);
      setCategories(cats || []);
    } catch (error) {
      showToast('Erro ao carregar dados dos relatórios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  // Chart data
  const chartData = dailyData.map(d => ({
    date: d.day ? `${d.day}/${month.substring(5, 7)}` : '',
    value: d.value || 0
  }));

  const renderKPIs = () => {
    if (!summary) return null;

    return (
      <div className="cards-grid">
        <Card accent={summary.remainingBudget >= 0 ? 'blue' : 'red'}>
          <div className="mc-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Saldo Disponível
          </div>
          <div className="mc-value">{Utils.formatCurrency(summary.remainingBudget)}</div>
          <div className="mc-sub">{summary.remainingBudget >= 0 ? 'Orçamento saudável' : 'Orçamento excedido'}</div>
        </Card>

        <Card>
          <div className="mc-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Total Gasto
          </div>
          <div className="mc-value">{Utils.formatCurrency(summary.totalSpent)}</div>
          <div className="mc-sub up">Neste mês</div>
        </Card>

        <Card>
          <div className="mc-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Orçamento Total
          </div>
          <div className="mc-value">{Utils.formatCurrency(summary.totalBudget)}</div>
          <div className="mc-sub">Definido nas categorias</div>
        </Card>

        <Card>
          <div className="mc-label" style={{ color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Maior Gasto
          </div>
          <div className="mc-value" style={{ color: 'var(--amber-400)' }}>
            {summary.largestExpense ? Utils.formatCurrency(summary.largestExpense.amount) : 'R$ 0,00'}
          </div>
          <div className="mc-sub" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }} title={summary.largestExpense ? summary.largestExpense.description : 'Sem despesas'}>
            {summary.largestExpense ? summary.largestExpense.description : 'Nenhum gasto registrado'}
          </div>
        </Card>

        <Card>
          <div className="mc-label" style={{ color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Gastos Recorrentes
          </div>
          <div className="mc-value" style={{ color: '#2D9CDB' }}>
            {Utils.formatCurrency(summary.recurrentSpent || 0)}
          </div>
          <div className="mc-sub">
            {summary.recurrentCount || 0} despesa{(summary.recurrentCount || 0) !== 1 ? 's' : ''} fixa{(summary.recurrentCount || 0) !== 1 ? 's' : ''}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Relatórios</h1>
          <p>Análises detalhadas do seu orçamento</p>
        </div>
        <div className="topbar-right">
          <input 
            type="month" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', outline: 'none', color: 'var(--text-main)', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Processando relatórios...</div>
        ) : (
          <>
            {renderKPIs()}

            <div className="chart-card">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '15px', fontWeight: 600 }}>Evolução Diária de Gastos</h3>
              <div className="chart-canvas-wrap" style={{ height: '300px' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValueDay" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2D9CDB" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2D9CDB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(val) => `R$ ${val}`} />
                      <Tooltip formatter={(value) => Utils.formatCurrency(value)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '13px' }} />
                      <Area type="monotone" dataKey="value" stroke="#2D9CDB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValueDay)" activeDot={{ r: 6, fill: '#2D9CDB', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                   <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-muted)' }}>Sem gastos registrados neste período.</div>
                )}
              </div>
            </div>

            <div className="cat-report">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '15px', fontWeight: 600 }}>Desempenho por Categoria</h3>
              <div className="cat-list">
                <div className="cat-row cat-row-head">
                  <div>Categoria</div>
                  <div>Uso do Orçamento</div>
                  <div className="col-right">Gasto</div>
                  <div className="col-right">Limite</div>
                  <div style={{ textAlign: 'center' }}>%</div>
                </div>
                
                {categoryData.length > 0 ? categoryData.map(cat => {
                  const categoryInfo = categories.find(c => c.id === cat.categoryId);
                  const color = categoryInfo ? (categoryInfo.colorCode || categoryInfo.colorHex) : '#333';
                  
                  let pctClass = 'pct-ok';
                  let fillClass = 'fill-ok';
                  if (cat.percentageUsed > 100) { pctClass = 'pct-over'; fillClass = 'fill-over'; }
                  else if (cat.percentageUsed >= 80) { pctClass = 'pct-warn'; fillClass = 'fill-warn'; }

                  return (
                    <div className="cat-row" key={cat.categoryId}>
                      <div className="cat-info">
                        <div className="cat-dot" style={{ backgroundColor: color }}></div>
                        <span className="cat-name">{cat.categoryName}</span>
                      </div>
                      
                      <div className="bar-outer">
                        <div className={`bar-inner ${fillClass}`} style={{ width: `${Math.min(cat.percentageUsed, 100)}%`, backgroundColor: cat.percentageUsed > 80 ? undefined : color }}></div>
                      </div>
                      
                      <div className="col-right col-spent">
                        {Utils.formatCurrency(cat.totalSpent)}
                      </div>
                      
                      <div className="col-right col-budget">
                        {Utils.formatCurrency(cat.budgetLimit)}
                      </div>
                      
                      <div style={{ textAlign: 'center' }}>
                        <span className={`pct-badge ${pctClass}`}>{cat.percentageUsed.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum dado para exibir neste mês.</div>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </>
  );
};
