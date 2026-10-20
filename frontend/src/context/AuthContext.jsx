import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setToken, setUnauthorizedHandler } from '../services/api'
import { authService, userService } from '../services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initialized, setInitialized] = useState(false)

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      const token = localStorage.getItem('conekta_token')
      if (!token) {
        setInitialized(true)
        return
      }
      try {
        const profile = await userService.profile()
        if (!cancelled) setUser(profile)
      } catch (error) {
        if (error.status === 401) logout()
      } finally {
        if (!cancelled) setInitialized(true)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [logout])

  const startSession = useCallback((token, sessionUser) => {
    setToken(token)
    setUser(sessionUser)
  }, [])

  const refreshUser = useCallback(async () => {
    const profile = await userService.profile()
    setUser(profile)
    return profile
  }, [])

  const login = useCallback(
    async (email, password) => {
      const auth = await authService.login(email, password)
      startSession(auth.token, auth.user)
      return auth.user
    },
    [startSession],
  )

  const register = useCallback(
    async (payload) => {
      const auth = await authService.register(payload)
      startSession(auth.token, auth.user)
      return auth.user
    },
    [startSession],
  )

  const loginByOtp = useCallback(
    async (phone, code) => {
      const auth = await authService.verifyOtp(phone, code)
      startSession(auth.token, auth.user)
      return auth.user
    },
    [startSession],
  )

  const demoLogin = useCallback(async () => {
    const auth = await authService.demoLogin()
    startSession(auth.token, auth.user)
    return auth.user
  }, [startSession])

  const value = useMemo(
    () => ({
      user,
      initialized,
      isAuthenticated: Boolean(user),
      login,
      loginByOtp,
      demoLogin,
      register,
      logout,
      refreshUser,
      startSession,
    }),
    [user, initialized, login, loginByOtp, demoLogin, register, logout, refreshUser, startSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
