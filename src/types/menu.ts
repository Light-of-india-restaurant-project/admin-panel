// Menu Category Types
export interface MenuCategory {
  _id: string
  name: string
  icon?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CategoryFormData {
  name: string
  icon?: string
  sortOrder: number
  isActive: boolean
}

// Menu Item Types
export interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  category: MenuCategory
  menuType: 'takeaway' | 'dine-in' | 'both'
  image?: string
  isVegetarian: boolean
  isSpicy: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ItemFormData {
  name: string
  description: string
  price: number
  category: string
  menuType: 'takeaway' | 'dine-in' | 'both'
  image?: string
  isVegetarian: boolean
  isSpicy: boolean
  isActive: boolean
  sortOrder: number
}

// Pagination Types
export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

// API Response Types
export interface CategoriesResponse {
  categories: MenuCategory[]
  pagination: Pagination
}

export interface ItemsResponse {
  items: MenuItem[]
  pagination: Pagination
}

// Query Params
export interface CategoryQueryParams {
  [key: string]: unknown
  page?: number
  limit?: number
  search?: string
  isActive?: string
}

export interface ItemQueryParams {
  [key: string]: unknown
  page?: number
  limit?: number
  search?: string
  category?: string
  menuType?: string
  isVegetarian?: string
  isSpicy?: string
  isActive?: string
}
