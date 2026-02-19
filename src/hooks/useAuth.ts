import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/api/client'
import { setCookie, removeCookie } from '@/utils/cookie'
import { AUTH_CONFIG, QUERY_KEYS } from '@/constants/config'
import type { 
  Admin, 
  LoginCredentials, 
  LoginResponse, 
  VerifyTokenResponse 
} from '@/types/auth'

// Verify current admin token
export function useVerifyToken() {
  return useQuery<Admin | null>({
    queryKey: [QUERY_KEYS.admin],
    queryFn: async () => {
      try {
        const data = await get<VerifyTokenResponse>({ url: 'admin/me' })
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
        }
      } catch (error) {
        // Only remove cookie on actual auth failure (401/403), not network errors
        const isAuthError = error instanceof Error && 
          (error.message.includes('401') || 
           error.message.includes('403') || 
           error.message.includes('Unauthorized') ||
           error.message.includes('Invalid token'))
        
        if (isAuthError) {
          removeCookie(AUTH_CONFIG.accessTokenKey)
          return null
        }
        
        // For network errors, throw to trigger retry/error state but keep session
        throw error
      }
    },
    retry: (failureCount, error) => {
      // Don't retry auth failures, but retry network errors up to 3 times
      const isAuthError = error instanceof Error && 
        (error.message.includes('401') || error.message.includes('403'))
      return !isAuthError && failureCount < 3
    },
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient()
  
  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      return post<LoginResponse>({ 
        url: 'admin/login', 
        body: credentials 
      })
    },
    onSuccess: (data) => {
      // Store token in cookie
      setCookie(AUTH_CONFIG.accessTokenKey, data.token, AUTH_CONFIG.tokenExpiry)
      // Update admin cache
      queryClient.setQueryData([QUERY_KEYS.admin], data.admin)
    },
  })
}

// Logout function
export function useLogout() {
  const queryClient = useQueryClient()
  
  return () => {
    // Remove token
    removeCookie(AUTH_CONFIG.accessTokenKey)
    // Clear admin cache
    queryClient.setQueryData([QUERY_KEYS.admin], null)
    // Invalidate all queries
    queryClient.clear()
  }
}
