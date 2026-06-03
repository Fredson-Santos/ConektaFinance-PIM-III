const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : (window.location.protocol === 'file:'
      ? 'http://localhost:5041/api'
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:5041/api'
          : '/api');

// Função de sanitização contra XSS
export function sanitizeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Wrapper para Fetch API com proteção contra token expirado
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('pim_token');
  const isAuthRoute = endpoint.startsWith('/Auth/') || endpoint.includes('/login') || endpoint.includes('/register');
  
  if (!token && !isAuthRoute) {
    throw new Error('Token não encontrado. Faça login novamente.');
  }
  
  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });

    if (response.status === 401 && !isAuthRoute) {
      localStorage.removeItem('pim_token');
      localStorage.removeItem('pim_user');
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    if (response.status === 403) {
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
    throw error;
  }
}

export const AuthService = {
  async login(email, password) {
    const response = await apiFetch('/Auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (response.token && response.user) {
      localStorage.setItem('pim_token', response.token);
      localStorage.setItem('pim_user', JSON.stringify(response.user));
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

export const ExpenseService = {
  getAll: () => apiFetch('/expenses'),
  getById: (id) => apiFetch(`/expenses/${id}`),
  create: (data) => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/expenses/${id}`, { method: 'DELETE' })
};

export const IncomeService = {
  getAll: () => apiFetch('/incomes'),
  getById: (id) => apiFetch(`/incomes/${id}`),
  create: (data) => apiFetch('/incomes', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/incomes/${id}`, { method: 'DELETE' })
};


export const CategoryService = {
  getAll: () => apiFetch('/categories'),
  getById: (id) => apiFetch(`/categories/${id}`),
  create: (data) => apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/categories/${id}`, { method: 'DELETE' })
};

export const ReportService = {
  getSummary: (startDate, endDate) => {
    let endpoint = '/reports/summary';
    if (startDate && endDate) {
      endpoint += `?start=${startDate}T00:00:00Z&end=${endDate}T23:59:59Z`;
    }
    return apiFetch(endpoint);
  },
  getByCategory: (startDate, endDate) => {
    let endpoint = '/reports/by-category';
    if (startDate && endDate) {
      endpoint += `?start=${startDate}T00:00:00Z&end=${endDate}T23:59:59Z`;
    }
    return apiFetch(endpoint);
  },
  getTrend: (startDate, endDate) => {
    let endpoint = '/reports/trend';
    if (startDate && endDate) {
      endpoint += `?start=${startDate}T00:00:00Z&end=${endDate}T23:59:59Z`;
    }
    return apiFetch(endpoint);
  },
  getDaily: (startDate, endDate) => {
    let endpoint = '/reports/daily';
    if (startDate && endDate) {
      endpoint += `?start=${startDate}T00:00:00Z&end=${endDate}T23:59:59Z`;
    }
    return apiFetch(endpoint);
  }
};

export const AlertService = {
  getAll: () => apiFetch('/alerts'),
  markAsRead: (id) => apiFetch(`/alerts/${id}/read`, { method: 'PUT' }),
  delete: (id) => apiFetch(`/alerts/${id}`, { method: 'DELETE' })
};

export const InsightService = {
  getAll: () => apiFetch('/insights')
};

export const ChatService = {
  getHistory: () => apiFetch('/chat'),
  sendMessage: (content) => apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  clearHistory: () => apiFetch('/chat', { method: 'DELETE' })
};

export const Utils = {
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  },
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }
};
