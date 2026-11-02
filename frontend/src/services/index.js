import { get, post, put, patch, del, postForm, downloadFile, getWithMeta } from './api'

export const authService = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (payload) => post('/auth/register', payload),
  requestOtp: (phone) => post('/auth/otp/request', { phone }),
  verifyOtp: (phone, code) => post('/auth/otp/verify', { phone, code }),
  demoLogin: () => post('/auth/demo', {}),
}

export const userService = {
  profile: () => get('/users/me'),
  updateProfile: (payload) => put('/users/me', payload),
  completeOnboarding: (payload) => put('/users/me/onboarding', payload),
  changePassword: (currentPassword, newPassword) =>
    put('/users/me/password', { currentPassword, newPassword }),
  preferences: () => get('/users/me/preferences'),
  updatePreferences: (payload) => put('/users/me/preferences', payload),
  resetData: () => post('/users/me/reset-data', {}),
  deleteAccount: (password) => del('/users/me', { password }),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('file', file)
    return postForm('/users/me/avatar', form)
  },
}

export const categoryService = {
  list: (params = {}) => {
    const query = new URLSearchParams()
    if (params.kind) query.set('kind', params.kind)
    if (params.month) query.set('month', params.month)
    if (params.year) query.set('year', params.year)
    return get(`/categories${query.toString() ? `?${query}` : ''}`)
  },
  create: (payload) => post('/categories', payload),
  update: (id, payload) => put(`/categories/${id}`, payload),
  remove: (id) => del(`/categories/${id}`),
}

export const budgetService = {
  upsert: (payload) => put('/budgets', payload),
  list: (month, year) => {
    const query = new URLSearchParams()
    if (month != null) query.set('month', month)
    if (year != null) query.set('year', year)
    return get(`/budgets${query.toString() ? `?${query}` : ''}`)
  },
}

export const transactionService = {
  list: (filters = {}) => {
    const query = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, value)
    })
    return getWithMeta(`/transactions${query.toString() ? `?${query}` : ''}`)
  },
  get: (id) => get(`/transactions/${id}`),
  create: (payload) => post('/transactions', payload),
  update: (id, payload) => put(`/transactions/${id}`, payload),
  remove: (id) => del(`/transactions/${id}`),
}

export const dashboardService = {
  overview: (params = {}) => {
    const query = new URLSearchParams()
    if (params.month) query.set('month', params.month)
    if (params.year) query.set('year', params.year)
    return get(`/dashboard/overview${query.toString() ? `?${query}` : ''}`)
  },
  weeklyExpenses: (date) => get(`/dashboard/weekly-expenses${date ? `?date=${date}` : ''}`),
  recentTransactions: (limit = 5) => get(`/dashboard/recent-transactions?limit=${limit}`),
  budgetMeters: (monthOrParams, yearArg, topArg = 4) => {
    let month, year, top
    if (monthOrParams && typeof monthOrParams === 'object') {
      month = monthOrParams.month
      year = monthOrParams.year
      top = monthOrParams.top ?? 4
    } else {
      month = monthOrParams
      year = yearArg
      top = topArg ?? 4
    }
    const query = new URLSearchParams()
    if (month != null) query.set('month', month)
    if (year != null) query.set('year', year)
    if (top != null) query.set('top', top)
    return get(`/dashboard/budget-meters${query.toString() ? `?${query}` : ''}`)
  },
}

export const reportService = {
  summary: (start, end) => get(`/reports/summary?start=${start}&end=${end}`),
  byCategory: (start, end, kind = 'expense') => get(`/reports/by-category?start=${start}&end=${end}&kind=${kind}`),
  trend: (months = 6) => get(`/reports/trend?months=${months}`),
  daily: (start, end) => get(`/reports/daily?start=${start}&end=${end}`),
  exportCsv: (start, end) => downloadFile(`/reports/export.csv?start=${start}&end=${end}`, `transacoes_${start}.csv`),
  exportJson: (start, end) => downloadFile(`/reports/export.json?start=${start}&end=${end}`, `transacoes_${start}.json`),
}

export const alertService = {
  list: (unreadOnly = false) => get(`/alerts${unreadOnly ? '?unreadOnly=true' : ''}`),
  unreadCount: () => get('/alerts/unread-count'),
  markRead: (id) => put(`/alerts/${id}/read`),
  dismiss: (id) => del(`/alerts/${id}`),
}

export const insightService = {
  list: () => get('/insights'),
}

export const copilotService = {
  history: () => get('/copilot/history'),
  sendMessage: (content, imageBase64 = null) =>
    post('/copilot/messages', { content, imageBase64 }),
  confirm: (messageId) => post(`/copilot/messages/${messageId}/confirm`, {}),
  clearHistory: () => del('/copilot/history'),
}

export const importService = {
  preview: (file) => {
    const form = new FormData()
    form.append('file', file)
    return postForm('/imports/preview', form)
  },
  confirm: (batchId, payload) => post(`/imports/${batchId}/confirm`, payload),
}

export const adminService = {
  metrics: () => get('/admin/metrics'),
  users: ({ search, page = 1, pageSize = 20 } = {}) => {
    const query = new URLSearchParams({ page, pageSize })
    if (search) query.set('search', search)
    return get(`/admin/users?${query}`)
  },
  updateStatus: (id, isActive) => patch(`/admin/users/${id}/status`, { isActive }),
}
