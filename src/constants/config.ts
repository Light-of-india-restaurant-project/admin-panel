// API Base URL - uses Vite proxy in development, env override in production
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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
  gallery: 'gallery',
  dashboardStats: 'dashboardStats',
  floors: 'floors',
  rows: 'rows',
  tables: 'tables',
  reservations: 'reservations',
  simpleReservations: 'simpleReservations',
  restaurantSettings: 'restaurantSettings',
} as const
