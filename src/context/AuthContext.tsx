import { createContext, useContext, ReactNode, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVerifyToken, useLogin, useLogout } from '@/hooks/useAuth'
import { getCookie } from '@/utils/cookie'
import { AUTH_CONFIG } from '@/constants/config'
import type { Admin, LoginCredentials, AuthContextType } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  
  // React Query hooks
  const { data: admin, isLoading, isError } = useVerifyToken()
  const loginMutation = useLogin()
  const logoutFn = useLogout()

  const login = useCallback(async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials)
  }, [loginMutation])

  const logout = useCallback(() => {
    logoutFn()
    navigate('/login')
  }, [logoutFn, navigate])

  // If there's a network error but we have a token, consider user as authenticated
  // This prevents logout on backend restart or network issues
  const hasToken = !!getCookie(AUTH_CONFIG.accessTokenKey)
  const isAuthenticated = !!admin || (isError && hasToken)

  const token = getCookie(AUTH_CONFIG.accessTokenKey) || null

  const value: AuthContextType = {
    admin: admin as Admin | null,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
