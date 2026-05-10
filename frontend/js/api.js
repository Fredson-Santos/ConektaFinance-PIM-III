const API_BASE_URL = 'http://localhost:5041/api';

// Configuração de Toast (UX)
function showToast(message, type = 'success') {
  // Remover toast existente
  const existingToast = document.getElementById('app-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // Estilos inline do toast para evitar quebrar o CSS existente
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 24px',
    borderRadius: '8px',
    background: type === 'success' ? '#3B6D11' : '#E24B4A',
    color: '#fff',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    opacity: '0',
    transform: 'translateY(20px)',
    transition: 'opacity 0.3s, transform 0.3s'
  });

  document.body.appendChild(toast);

  // Animar entrada
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Remover após 3 segundos
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Wrapper para Fetch API
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('pim_token') || 'mocked_token_for_now';
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });

    if (response.status === 401) {
      localStorage.removeItem('pim_token');
      window.location.href = 'tela-login.html';
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Erro ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Retornar null se for 204 No Content
    if (response.status === 204) return null;
    
    return await response.json();
  } catch (error) {
    console.error(`API Error na rota ${endpoint}:`, error);
    showToast(error.message, 'error');
    throw error;
  }
}

// ==========================================
// SERVIÇOS DA API
// ==========================================

const AuthService = {
  // MOCK until backend Auth is ready
  async login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          localStorage.setItem('pim_token', 'mock_jwt_token_123');
          resolve({ token: 'mock_jwt_token_123', user: { name: 'João Silva', email }});
        } else {
          reject(new Error('Credenciais inválidas'));
        }
      }, 500);
    });
  },
  
  async register(data) {
    return new Promise(resolve => setTimeout(() => resolve(true), 500));
  },
  
  logout() {
    localStorage.removeItem('pim_token');
    window.location.href = 'tela-login.html';
  }
};

const ExpenseService = {
  getAll: () => apiFetch('/expenses'),
  getById: (id) => apiFetch(`/expenses/${id}`),
  create: (data) => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/expenses/${id}`, { method: 'DELETE' })
};

const CategoryService = {
  getAll: () => apiFetch('/categories'),
  getById: (id) => apiFetch(`/categories/${id}`),
  create: (data) => apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/categories/${id}`, { method: 'DELETE' })
};

const ReportService = {
  getSummary: () => apiFetch('/reports/summary'),
  getByCategory: () => apiFetch('/reports/by-category'),
  getTrend: () => apiFetch('/reports/trend')
};

const AlertService = {
  getAll: () => apiFetch('/alerts'),
  markAsRead: (id) => apiFetch(`/alerts/${id}/read`, { method: 'PUT' }),
  delete: (id) => apiFetch(`/alerts/${id}`, { method: 'DELETE' })
};

const InsightService = {
  getAll: () => apiFetch('/insights')
};

// ==========================================
// UTILS
// ==========================================

const Utils = {
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  },
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  },
  showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<div style="display:flex; justify-content:center; padding: 2rem;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div><style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>';
  }
};
