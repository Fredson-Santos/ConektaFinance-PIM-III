const TOKEN_KEY = 'conekta_token'

export class ApiError extends Error {
  constructor(status, problem) {
    super(problem?.detail || problem?.title || 'Falha de comunicação com o servidor')
    this.name = 'ApiError'
    this.status = status
    this.problem = problem || {}
    this.errors = problem?.errors || null
  }
}

let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, { title: 'Sem conexão', detail: 'Verifique sua internet e tente novamente.' })
  }
  if (response.status === 401 && onUnauthorized) onUnauthorized()
  const contentType = response.headers.get('content-type') || ''
  if (!response.ok) {
    const problem = contentType.includes('json')
      ? await response.json().catch(() => ({}))
      : {}
    throw new ApiError(response.status, problem)
  }
  if (response.status === 204) return null
  if (contentType.includes('json')) return response.json()
  return response
}

export function get(path) {
  return request(path)
}

export function post(path, body) {
  return request(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
}

export function put(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) })
}

export function del(path, body) {
  return request(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined })
}

export function postForm(path, formData) {
  return request(path, { method: 'POST', body: formData })
}

export async function downloadFile(path, fileName) {
  const response = await request(path)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
