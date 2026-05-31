import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { ReportService, ExpenseService, CategoryService, IncomeService, AlertService, Utils } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Dashboard = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [lastExpenses, setLastExpenses] = useState([]);
  const [categoryReport, setCategoryReport] = useState([]);
  const [trendReport, setTrendReport] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  let myLineChart = useRef(null);
  let myDoughnutChart = useRef(null);

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
      setLastExpenses(expenses);
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

  useEffect(() => {
    if (loading) return;

    if (myLineChart.current) myLineChart.current.destroy();
    if (myDoughnutChart.current) myDoughnutChart.current.destroy();

    const Chart = window.Chart;
    if (!Chart) return;

    // Line Chart
    if (lineChartRef.current) {
      const lineLabels = trendReport?.length > 0 ? trendReport.map(t => t.period) : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
      const lineData = trendReport?.length > 0 ? trendReport.map(t => t.value) : [0, 0, 0, 0, summary?.totalSpent || 0];

      myLineChart.current = new Chart(lineChartRef.current, {
        type: 'line',
        data: {
          labels: lineLabels,
          datasets: [{
            label: 'Gastos (R$)',
            data: lineData,
            borderColor: '#3B6D11',
            backgroundColor: 'rgba(59,109,17,0.08)',
            borderWidth: 2,
            pointBackgroundColor: '#3B6D11',
            pointRadius: 4,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, color: '#888' } },
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#888' } }
          }
        }
      });
    }

    // Doughnut Chart
    if (doughnutChartRef.current) {
      let doughnutLabels = ['Sem gastos'];
      let doughnutData = [1];
      let doughnutColors = ['#e0e0e0'];

      if (categoryReport?.length > 0) {
        const activeCats = categoryReport.filter(c => c.totalSpent > 0);
        if (activeCats.length > 0) {
          doughnutLabels = activeCats.map(c => c.categoryName);
          doughnutData = activeCats.map(c => c.totalSpent);
          doughnutColors = activeCats.map(c => {
            const catObj = categories.find(cat => cat.id === c.categoryId);
            return catObj ? catObj.colorCode || catObj.colorHex || '#3B6D11' : '#3B6D11';
          });
        }
      }

      myDoughnutChart.current = new Chart(doughnutChartRef.current, {
        type: 'doughnut',
        data: {
          labels: doughnutLabels,
          datasets: [{
            data: doughnutData,
            backgroundColor: doughnutColors,
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '65%',
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } } }
        }
      });
    }

    return () => {
      if (myLineChart.current) myLineChart.current.destroy();
      if (myDoughnutChart.current) myDoughnutChart.current.destroy();
    };
  }, [summary, categoryReport, trendReport, categories, loading]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '-4rem' }}>
         <input 
            type="month" 
            className="month-select" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ fontFamily:'DM Sans', fontSize:'13px', fontWeight:500, color:'var(--text-muted)', background:'var(--white)', border:'1px solid var(--border)', borderRadius:'8px', padding:'0.45rem 0.8rem', cursor:'pointer', outline:'none', height:'38px' }} 
         />
         <Button style={{background:'#3B6D11', borderColor:'#3B6D11'}}>+ Adicionar entrada</Button>
         <Button>+ Novo gasto</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando dados...</div>
      ) : (
        <>
          {renderKPIs()}

          <div className="charts-row">
            <div className="chart-card">
              <h3>Evolução dos gastos — últimos 6 meses</h3>
              <div className="chart-canvas-wrap">
                <canvas ref={lineChartRef}></canvas>
              </div>
            </div>
            <div className="chart-card">
              <h3>Distribuição por categoria</h3>
              <div className="chart-canvas-wrap">
                <canvas ref={doughnutChartRef}></canvas>
              </div>
            </div>
          </div>

          {/* Tabelas e Alertas */}
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
  );
};
