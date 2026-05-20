const API_BASE_URL = (window.location.protocol === 'file:')
  ? 'http://localhost:5041/api'
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))
    ? (window.location.hostname.startsWith('192.168.') ? `http://${window.location.hostname}:5041/api` : 'http://localhost:5041/api')
    : '/api'; // Relative path for production VPS deployment (proxied by Nginx)

// Função de sanitização contra XSS
function sanitizeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str; // textContent escapa caracteres HTML
  return div.innerHTML;
}

// Configuração de Toast (UX)
function showToast(message, type = 'success') {
  const existingToast = document.getElementById('app-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

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

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Wrapper para Fetch API com proteção contra token expirado
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('pim_token');
  
  // Se não houver token, redirecionar para login
  if (!token) {
    window.location.href = 'tela-login.html';
    throw new Error('Token não encontrado. Faça login novamente.');
  }
  
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
      // Token expirado ou inválido - limpar sessão completamente
      localStorage.removeItem('pim_token');
      localStorage.removeItem('pim_user');
      showToast('Sua sessão expirou. Por favor, faça login novamente.', 'error');
      setTimeout(() => {
        window.location.href = 'tela-login.html';
      }, 1000);
      throw new Error('Sessão expirada.');
    }

    if (response.status === 403) {
      showToast('Você não tem permissão para acessar este recurso.', 'error');
      throw new Error('Acesso negado.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Erro ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    if (response.status === 204) return null;
    
    return await response.json();
  } catch (error) {
    console.error(`API Error na rota ${endpoint}:`, error);
    // Não mostrar toast se já foi mostrada uma mensagem de expiração
    if (error.message !== 'Sessão expirada.') {
      showToast(error.message, 'error');
    }
    throw error;
  }
}

// ==========================================
// SERVIÇOS DA API
// ==========================================

const AuthService = {
  async login(email, password) {
    const response = await apiFetch('/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (response.token && response.user) {
      localStorage.setItem('pim_token', response.token);
      localStorage.setItem('pim_user', JSON.stringify(response.user));
      // Validar que o login foi bem-sucedido armazenando também o timestamp
      localStorage.setItem('pim_login_time', new Date().toISOString());
    }
    return response;
  },
  
  async register(data) {
    return apiFetch('/Auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  logout() {
    localStorage.removeItem('pim_token');
    localStorage.removeItem('pim_user');
    localStorage.removeItem('pim_login_time');
    window.location.href = 'tela-login.html';
  },

  loadUser() {
    const userStr = localStorage.getItem('pim_user');
    const token = localStorage.getItem('pim_token');
    
    if (!userStr || !token) {
      return null;
    }
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
};

const ExpenseService = {
  getAll: () => apiFetch('/expenses'),
  getById: (id) => apiFetch(`/expenses/${id}`),
  create: (data) => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/expenses/${id}`, { method: 'DELETE' })
};

const IncomeService = {
  getAll: () => apiFetch('/incomes'),
  getById: (id) => apiFetch(`/incomes/${id}`),
  create: (data) => apiFetch('/incomes', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/incomes/${id}`, { method: 'DELETE' })
};


const CategoryService = {
  getAll: () => apiFetch('/categories'),
  getById: (id) => apiFetch(`/categories/${id}`),
  create: (data) => apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/categories/${id}`, { method: 'DELETE' })
};

const ReportService = {
  getSummary: (startDate, endDate) => {
    let endpoint = '/reports/summary';
    if (startDate && endDate) {
      endpoint += `?start=${startDate}&end=${endDate}`;
    }
    return apiFetch(endpoint);
  },
  getByCategory: (startDate, endDate) => {
    let endpoint = '/reports/by-category';
    if (startDate && endDate) {
      endpoint += `?start=${startDate}&end=${endDate}`;
    }
    return apiFetch(endpoint);
  },
  getTrend: (startDate, endDate) => {
    let endpoint = '/reports/trend';
    if (startDate && endDate) {
      endpoint += `?start=${startDate}&end=${endDate}`;
    }
    return apiFetch(endpoint);
  }
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
  sanitizeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str; // textContent escapa caracteres HTML
    return div.innerHTML;
  },
  showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<div style="display:flex; justify-content:center; padding: 2rem;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div><style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>';
  }
};

// ==========================================
// GERENCIAMENTO DE SESSÃO / USUÁRIO (DOM)
// ==========================================

// Valida se o usuário ainda está autenticado (verificação básica)
function validateSession() {
  const token = localStorage.getItem('pim_token');
  const userStr = localStorage.getItem('pim_user');
  
  // Se não houver token ou usuário, redirecionar para login
  if (!token || !userStr) {
    if (window.location.pathname !== '/frontend/pages/tela-login.html' && 
        !window.location.pathname.includes('tela-login')) {
      window.location.href = 'tela-login.html';
    }
    return false;
  }

  return true;
}

function updateUserInfo() {
  const userStr = localStorage.getItem('pim_user');
  if (!userStr) return;

  try {
    const user = JSON.parse(userStr);
    const nameElem = document.querySelector('.user-pill .name');
    const roleElem = document.querySelector('.user-pill .role');
    const avatarElem = document.querySelector('.user-pill .avatar');

    if (nameElem && user.fullName) {
      nameElem.textContent = user.fullName;
    }

    if (roleElem) {
      roleElem.textContent = user.accountType === 'Standard' ? 'Conta pessoal' : (user.accountType || 'Conta pessoal');
    }

    if (avatarElem && user.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      let initials = '';
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        initials = parts[0].substring(0, 2).toUpperCase();
      }
      avatarElem.textContent = initials;
    }
  } catch (err) {
    console.error('Erro ao atualizar informações do usuário:', err);
  }
}

// Valida a sessão quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
  validateSession();
  updateUserInfo();
});

// Também valida ao focar a aba (em caso de refresh enquanto fora da aba)
window.addEventListener('focus', () => {
  validateSession();
});
