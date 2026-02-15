import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put, patch, deleteApi } from '@/api/client'
import { QUERY_KEYS } from '@/constants/config'
import type {
  TableFormData,
  TableQueryParams,
  TablesResponse,
  SingleTableResponse,
  ReservationUpdateData,
  ReservationQueryParams,
  ReservationsResponse,
  SingleReservationResponse,
  RestaurantSettingsFormData,
  RestaurantSettingsResponse,
  OperatingHours,
  ReservationStatus,
} from '@/types/reservation'

// ==================== TABLES ====================

// Get all tables with pagination
export const useGetTables = (params: TableQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.tables, params],
    queryFn: () => get<TablesResponse>({ url: 'reservations/admin/tables', params: params as Record<string, unknown> }),
  })

// Get table by ID
export const useGetTable = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.tables, id],
    queryFn: () => get<SingleTableResponse>({ url: `reservations/admin/tables/${id}` }),
    enabled: !!id,
  })

// Create table
export const useCreateTable = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: TableFormData) => 
      post<SingleTableResponse>({ url: 'reservations/admin/tables', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tables] })
    },
  })
}

// Update table
export const useUpdateTable = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TableFormData> }) =>
      patch<SingleTableResponse>({ url: `reservations/admin/tables/${id}`, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tables] })
    },
  })
}

// Delete table
export const useDeleteTable = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      deleteApi<{ message: string }>({ url: `reservations/admin/tables/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tables] })
    },
  })
}

// ==================== RESERVATIONS ====================

// Get all reservations with pagination
export const useGetReservations = (params: ReservationQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.reservations, params],
    queryFn: () => get<ReservationsResponse>({ url: 'reservations/admin', params: params as Record<string, unknown> }),
  })

// Get reservation by ID
export const useGetReservation = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.reservations, id],
    queryFn: () => get<SingleReservationResponse>({ url: `reservations/admin/${id}` }),
    enabled: !!id,
  })

// Update reservation
export const useUpdateReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReservationUpdateData }) =>
      patch<SingleReservationResponse>({ url: `reservations/admin/${id}`, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.reservations] })
    },
  })
}

// Update reservation status
export const useUpdateReservationStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      patch<SingleReservationResponse>({ url: `reservations/admin/${id}/status`, body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.reservations] })
    },
  })
}

// Confirm reservation
export const useConfirmReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) =>
      post<SingleReservationResponse>({ url: `reservations/admin/${id}/confirm` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.reservations] })
    },
  })
}

// Cancel reservation
export const useCancelReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) =>
      post<SingleReservationResponse>({ url: `reservations/admin/${id}/cancel` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.reservations] })
    },
  })
}

// Mark as completed
export const useCompleteReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) =>
      post<SingleReservationResponse>({ url: `reservations/admin/${id}/complete` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.reservations] })
    },
  })
}

// Mark as no-show
export const useNoShowReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) =>
      post<SingleReservationResponse>({ url: `reservations/admin/${id}/no-show` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.reservations] })
    },
  })
}

// Delete reservation
export const useDeleteReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      deleteApi<{ message: string }>({ url: `reservations/admin/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.reservations] })
    },
  })
}

// ==================== RESTAURANT SETTINGS ====================

// Get restaurant settings
export const useGetRestaurantSettings = () =>
  useQuery({
    queryKey: [QUERY_KEYS.restaurantSettings],
    queryFn: () => get<RestaurantSettingsResponse>({ url: 'reservations/settings' }),
  })

// Update all settings
export const useUpdateRestaurantSettings = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: RestaurantSettingsFormData) =>
      put<RestaurantSettingsResponse>({ url: 'reservations/admin/settings', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.restaurantSettings] })
    },
  })
}

// Update operating hours only
export const useUpdateOperatingHours = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (operatingHours: OperatingHours[]) =>
      patch<RestaurantSettingsResponse>({ 
        url: 'reservations/admin/settings/operating-hours', 
        body: { operatingHours } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.restaurantSettings] })
    },
  })
}

// Update reservation settings only
export const useUpdateReservationSettings = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<RestaurantSettingsFormData, 'operatingHours'>) =>
      patch<RestaurantSettingsResponse>({ 
        url: 'reservations/admin/settings/reservation', 
        body: data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.restaurantSettings] })
    },
  })
}
