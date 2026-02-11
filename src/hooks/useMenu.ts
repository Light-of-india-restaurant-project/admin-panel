import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put, deleteApi } from '@/api/client'
import { QUERY_KEYS } from '@/constants/config'
import type {
  MenuCategory,
  MenuItem,
  CategoriesResponse,
  ItemsResponse,
  CategoryFormData,
  ItemFormData,
  CategoryQueryParams,
  ItemQueryParams,
} from '@/types/menu'

// ==================== CATEGORIES ====================

// Get all categories with pagination
export const useGetCategories = (params: CategoryQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.categories, params],
    queryFn: () => get<CategoriesResponse>({ url: 'menu/categories', params }),
  })

// Get all categories (for dropdowns - no pagination)
export const useGetAllCategories = () =>
  useQuery({
    queryKey: [QUERY_KEYS.categories, 'all'],
    queryFn: () => get<CategoriesResponse>({ url: 'menu/categories', params: { limit: 1000 } }),
  })

// Create category
export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CategoryFormData) => 
      post<{ category: MenuCategory }>({ url: 'menu/categories', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] })
    },
  })
}

// Update category
export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      put<{ category: MenuCategory }>({ url: `menu/categories/${id}`, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] })
    },
  })
}

// Delete category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      deleteApi<{ message: string }>({ url: `menu/categories/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] })
    },
  })
}

// ==================== MENU ITEMS ====================

// Get all items with pagination
export const useGetItems = (params: ItemQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.items, params],
    queryFn: () => get<ItemsResponse>({ url: 'menu/items', params }),
  })

// Get all items (for stats - no pagination)
export const useGetAllItems = () =>
  useQuery({
    queryKey: [QUERY_KEYS.items, 'all'],
    queryFn: () => get<ItemsResponse>({ url: 'menu/items', params: { limit: 1000 } }),
  })

// Create item
export const useCreateItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ItemFormData) => 
      post<{ item: MenuItem }>({ url: 'menu/items', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.items] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] })
    },
  })
}

// Update item
export const useUpdateItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemFormData> }) =>
      put<{ item: MenuItem }>({ url: `menu/items/${id}`, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.items] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] })
    },
  })
}

// Delete item
export const useDeleteItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      deleteApi<{ message: string }>({ url: `menu/items/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.items] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] })
    },
  })
}

// ==================== DASHBOARD ====================

// Dashboard stats hook
export const useDashboardStats = () => {
  const categoriesQuery = useGetAllCategories()
  const itemsQuery = useGetAllItems()

  const categories = categoriesQuery.data?.categories || []
  const items = itemsQuery.data?.items || []

  const stats = {
    totalCategories: categories.length,
    totalItems: items.length,
    activeItems: items.filter((i) => i.isActive).length,
    dineInItems: items.filter((i) => i.menuType === 'dine-in' || i.menuType === 'both').length,
    takeawayItems: items.filter((i) => i.menuType === 'takeaway' || i.menuType === 'both').length,
  }

  // Get recent items (last 5)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return {
    stats,
    recentItems,
    isLoading: categoriesQuery.isLoading || itemsQuery.isLoading,
    isError: categoriesQuery.isError || itemsQuery.isError,
  }
}
