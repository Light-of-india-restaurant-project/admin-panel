import { createContext, useContext, ReactNode, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVerifyToken, useLogin, useLogout } from '@/hooks/useAuth'
import type { Admin, LoginCredentials, AuthContextType } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  
  // React Query hooks
  const { data: admin, isLoading } = useVerifyToken()
  const loginMutation = useLogin()
  const logoutFn = useLogout()

  const login = useCallback(async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials)
  }, [loginMutation])

  const logout = useCallback(() => {
    logoutFn()
    navigate('/login')
  }, [logoutFn, navigate])

  const value: AuthContextType = {
    admin: admin as Admin | null,
    isAuthenticated: !!admin,
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
