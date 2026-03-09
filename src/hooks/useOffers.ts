import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put, deleteApi } from '@/api/client'
import { QUERY_KEYS } from '@/constants/config'
import type {
  Offer,
  OffersResponse,
  OfferFormData,
  OfferQueryParams,
} from '@/types/offer'

// Get all offers with pagination
export const useGetOffers = (params: OfferQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.offers, params],
    queryFn: () => get<OffersResponse>({ url: 'offers', params }),
  })

// Get all offers (for stats - no pagination)
export const useGetAllOffers = () =>
  useQuery({
    queryKey: [QUERY_KEYS.offers, 'all'],
    queryFn: () => get<OffersResponse>({ url: 'offers', params: { limit: 1000 } }),
  })

// Create offer
export const useCreateOffer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: OfferFormData) => 
      post<{ offer: Offer }>({ url: 'offers', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.offers] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] })
    },
  })
}

// Update offer
export const useUpdateOffer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OfferFormData> }) =>
      put<{ offer: Offer }>({ url: `offers/${id}`, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.offers] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] })
    },
  })
}

// Delete offer
export const useDeleteOffer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      deleteApi<{ message: string }>({ url: `offers/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.offers] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] })
    },
  })
}
