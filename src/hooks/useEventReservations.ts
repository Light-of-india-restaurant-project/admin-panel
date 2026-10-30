import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/api/client'
import { QUERY_KEYS } from '@/constants/config'

import type {
  EventReservationQueryParams,
  EventReservationsResponse,
  SingleEventReservationResponse,
  EventSettingsResponse,
} from '@/types/eventReservation'

export const useGetEventReservations = (params: EventReservationQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.eventReservations, params],
    queryFn: () => get<EventReservationsResponse>({ url: 'reservations/admin/events', params: params as Record<string, unknown> }),
  })

export const useGetEventReservation = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.eventReservations, id],
    queryFn: () => get<SingleEventReservationResponse>({ url: `reservations/admin/events/${id}` }),
    enabled: !!id,
  })

export const useCancelEventReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, cancellationReason, adminNote }: { id: string; cancellationReason?: string; adminNote?: string }) =>
      post<SingleEventReservationResponse>({
        url: `reservations/admin/events/${id}/cancel`,
        body: { cancellationReason, adminNote },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.eventReservations] })
    },
  })
}

export const useGetEventSettings = () =>
  useQuery({
    queryKey: [QUERY_KEYS.eventSettings],
    queryFn: () => get<EventSettingsResponse>({ url: 'reservations/admin/event-settings' }),
  })

export const useUpdateEventSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      patch<EventSettingsResponse>({
        url: 'reservations/admin/event-settings',
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.eventSettings] })
    },
  })
}
