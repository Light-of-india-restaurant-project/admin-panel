// API Base URL - uses Vite proxy in development
export const API_BASE_URL = '/api'

// Auth Cookie Configuration
export const AUTH_CONFIG = {
  accessTokenKey: 'admin_access_token',
  refreshTokenKey: 'admin_refresh_token',
  tokenExpiry: 7, // days
}

// Query Keys for React Query
export const QUERY_KEYS = {
  admin: 'admin',
  categories: 'categories',
  items: 'items',
  dashboardStats: 'dashboardStats',
  tables: 'tables',
  reservations: 'reservations',
  restaurantSettings: 'restaurantSettings',
} as const
