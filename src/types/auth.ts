// Admin User Types
export interface Admin {
  id: string
  email: string
  name: string
  role: string
}

// Login Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  admin: Admin
  message?: string
}

// Verify Token Response
export interface VerifyTokenResponse {
  id: string
  email: string
  name: string
  role: string
}

// Auth Context Types
export interface AuthContextType {
  admin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}
