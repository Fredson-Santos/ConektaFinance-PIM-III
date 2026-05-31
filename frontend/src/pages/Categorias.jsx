import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { CategoryService } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Categorias = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '-4rem' }}>
         <Button>+ Nova Categoria</Button>
      </div>

      <div className="table-card">
        <h3>Suas Categorias</h3>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cor</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td data-label="Nome">
                    <Badge style={{ background: `${c.colorCode || '#333'}22`, color: c.colorCode || '#333' }}>
                      {c.name}
                    </Badge>
                  </td>
                  <td data-label="Cor">{c.colorCode || '-'}</td>
                  <td data-label="Ações" style={{ textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px' }}>Editar</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                    Nenhuma categoria encontrada.
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
