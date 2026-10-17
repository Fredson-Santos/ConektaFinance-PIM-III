import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { CategoryService, Utils } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Categorias = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({ id: null, name: '', description: '', colorCode: '#3B6D11', budgetLimit: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ id: null, name: '', description: '', colorCode: '#3B6D11', budgetLimit: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setModalMode('edit');
    setFormData({ 
      id: cat.id, 
      name: cat.name, 
      description: cat.description || '', 
      colorCode: cat.colorCode || '#3B6D11', 
      budgetLimit: cat.budgetLimit || '' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        colorCode: formData.colorCode,
        icon: 'tag',
        budgetLimit: parseFloat(formData.budgetLimit) || null
      };

      if (modalMode === 'create') {
        await CategoryService.create(payload);
        showToast('Categoria criada com sucesso!');
      } else {
        await CategoryService.update(formData.id, payload);
        showToast('Categoria atualizada com sucesso!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast('Erro ao salvar categoria', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta categoria?')) return;
    try {
      await CategoryService.delete(id);
      showToast('Categoria deletada com sucesso!');
      loadData();
    } catch (err) {
      if (err.message && err.message.includes('500')) {
        showToast('Não é possível deletar categorias que possuem gastos vinculados.', 'error');
      } else {
        showToast('Erro ao deletar categoria', 'error');
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await CategoryService.getAll();
      setCategories(data || []);
    } catch (error) {
      showToast('Erro ao carregar categorias', 'error');
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
          <h1>Categorias</h1>
          <p>Gerencie as tags para classificar seus gastos</p>
        </div>
        <div className="topbar-right">
          <Button style={{ background: '#3B6D11', borderColor: '#3B6D11' }} onClick={openCreateModal}>+ Nova categoria</Button>
        </div>
      </div>

      <div style={{ padding: '1rem 0' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {categories.map(c => {
              const color = c.colorCode || '#333';
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    </div>
                    <div style={{ background: color, color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      Limite: {Utils.formatCurrency(c.budgetLimit || 0)}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '0.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '18px', color: '#111', fontWeight: '600' }}>{c.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{c.description || 'Categoria de gastos'}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem' }}>
                    <button onClick={() => openEditModal(c)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(c.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Deletar
                    </button>
                  </div>
                </div>
              );
            })}
            
            {categories.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhuma categoria encontrada.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL Categoria */}
      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} style={{ display: isModalOpen ? 'flex' : 'none' }}>
        <div className="modal-content">
          <button className="modal-close" onClick={() => setIsModalOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="modal-header">
            <h3>{modalMode === 'create' ? 'Nova Categoria' : 'Editar Categoria'}</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', color: '#555', fontWeight: 'bold' }}>Nome</label>
              <input type="text" placeholder="Ex: Moradia" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="field">
              <label style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', color: '#555', fontWeight: 'bold' }}>Descrição</label>
              <input type="text" placeholder="Ex: Aluguel, luz, água..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="field">
              <label style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', color: '#555', fontWeight: 'bold' }}>Limite Mensal</label>
              <div className="amount-field">
                <span className="prefix" style={{ color: '#888', fontWeight: 'bold' }}>R$</span>
                <input type="number" placeholder="0,00" step="0.01" value={formData.budgetLimit} onChange={e => setFormData({...formData, budgetLimit: e.target.value})} style={{ fontWeight: 'bold', fontSize: '16px' }} />
              </div>
            </div>
            
            <div className="field">
              <label style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', color: '#555', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Cor da Categoria</label>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {[ '#E24B4A', '#FF5733', '#F5A623', '#3B6D11', '#2D9CDB', '#9B51E0', '#F472B6', '#14B8A6' ].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, colorCode: color})}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: formData.colorCode === color ? '2px solid #333' : '2px solid transparent',
                      boxShadow: formData.colorCode === color ? '0 0 0 2px #fff inset' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'transform 0.1s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
                <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', border: '1px dashed #ccc', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', transition: 'transform 0.1s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  <input type="color" value={formData.colorCode} onChange={e => setFormData({...formData, colorCode: e.target.value})} style={{ position: 'absolute', top: '-10px', left: '-10px', width: '64px', height: '64px', cursor: 'pointer', opacity: 0 }} title="Cor personalizada" />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
              </div>
            </div>
            
            <div className="btn-row" style={{marginTop: '1.5rem'}}>
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{background:'#3B6D11'}} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Categoria'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
