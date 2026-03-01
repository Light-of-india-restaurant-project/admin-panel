import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put, patch, deleteApi } from '@/api/client'
import { QUERY_KEYS } from '@/constants/config'
import type {
  FloorFormData,
  FloorQueryParams,
  FloorsResponse,
  SingleFloorResponse,
  RowFormData,
  RowQueryParams,
  RowsResponse,
  SingleRowResponse,
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
  SimpleReservationStatus,
  SimpleReservationResponse,
  SingleSimpleReservationResponse,
} from '@/types/reservation'

// ==================== FLOORS ====================

// Get all floors with pagination
export const useGetFloors = (params: FloorQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.floors, params],
    queryFn: () => get<FloorsResponse>({ url: 'reservations/admin/floors', params: params as Record<string, unknown> }),
  })

// Get floor by ID
export const useGetFloor = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.floors, id],
    queryFn: () => get<SingleFloorResponse>({ url: `reservations/admin/floors/${id}` }),
    enabled: !!id,
  })

// Create floor
export const useCreateFloor = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: FloorFormData) => 
      post<SingleFloorResponse>({ url: 'reservations/admin/floors', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.floors] })
    },
  })
}

// Update floor
export const useUpdateFloor = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FloorFormData> }) =>
      patch<SingleFloorResponse>({ url: `reservations/admin/floors/${id}`, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.floors] })
    },
  })
}

// Delete floor
export const useDeleteFloor = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      deleteApi<{ message: string }>({ url: `reservations/admin/floors/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.floors] })
    },
  })
}

// ==================== ROWS ====================

// Get all rows with pagination
export const useGetRows = (params: RowQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.rows, params],
    queryFn: () => get<RowsResponse>({ url: 'reservations/admin/rows', params: params as Record<string, unknown> }),
  })

// Get rows by floor
export const useGetRowsByFloor = (floorId: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.rows, 'floor', floorId],
    queryFn: () => get<RowsResponse>({ url: `reservations/admin/floors/${floorId}/rows` }),
    enabled: !!floorId,
  })

// Get row by ID
export const useGetRow = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.rows, id],
    queryFn: () => get<SingleRowResponse>({ url: `reservations/admin/rows/${id}` }),
    enabled: !!id,
  })

// Create row
export const useCreateRow = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: RowFormData) => 
      post<SingleRowResponse>({ url: 'reservations/admin/rows', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rows] })
    },
  })
}

// Update row
export const useUpdateRow = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RowFormData> }) =>
      patch<SingleRowResponse>({ url: `reservations/admin/rows/${id}`, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rows] })
    },
  })
}

// Delete row
export const useDeleteRow = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      deleteApi<{ message: string }>({ url: `reservations/admin/rows/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.rows] })
    },
  })
}

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

// Update closed dates only
export const useUpdateClosedDates = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (closedDates: string[]) =>
      patch<RestaurantSettingsResponse>({ 
        url: 'reservations/admin/settings/closed-dates', 
        body: { closedDates } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.restaurantSettings] })
    },
  })
}

// ==================== SIMPLE RESERVATIONS ====================

// Query params type for simple reservations
interface SimpleReservationQueryParams {
  status?: SimpleReservationStatus
  startDate?: string
  endDate?: string
  skip?: number
  limit?: number
}

// Get all simple reservations
export const useGetSimpleReservations = (params: SimpleReservationQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.simpleReservations, params],
    queryFn: () => get<SimpleReservationResponse>({ 
      url: 'reservations/admin/simple', 
      params: params as Record<string, unknown> 
    }),
  })

// Get simple reservation by ID
export const useGetSimpleReservation = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.simpleReservations, id],
    queryFn: () => get<SingleSimpleReservationResponse>({ url: `reservations/admin/simple/${id}` }),
    enabled: !!id,
  })

// Accept simple reservation
export const useAcceptSimpleReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      post<SingleSimpleReservationResponse>({ 
        url: `reservations/admin/simple/${id}/accept`, 
        body: { adminNote } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.simpleReservations] })
    },
  })
}

// Reject simple reservation
export const useRejectSimpleReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, rejectionReason, adminNote }: { id: string; rejectionReason: string; adminNote?: string }) =>
      post<SingleSimpleReservationResponse>({ 
        url: `reservations/admin/simple/${id}/reject`, 
        body: { rejectionReason, adminNote } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.simpleReservations] })
    },
  })
}

// Cancel simple reservation
export const useCancelSimpleReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, cancellationReason, adminNote }: { id: string; cancellationReason: string; adminNote?: string }) =>
      post<SingleSimpleReservationResponse>({ 
        url: `reservations/admin/simple/${id}/cancel`, 
        body: { cancellationReason, adminNote } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.simpleReservations] })
    },
  })
}

// Delete simple reservation
export const useDeleteSimpleReservation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      deleteApi<{ message: string }>({ url: `reservations/admin/simple/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.simpleReservations] })
    },
  })
}
