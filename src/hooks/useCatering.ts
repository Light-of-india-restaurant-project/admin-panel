import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, deleteApi, patch } from '@/api/client';
import type {
  CateringPacksResponse,
  CateringPackResponse,
  CateringPackFormData,
  CateringPacksQueryParams,
  CateringOrdersResponse,
  CateringOrderResponse,
  CateringOrdersQueryParams,
  DeliveryStatus,
} from '@/types/catering';

const QUERY_KEYS = {
  cateringPacks: 'cateringPacks',
  cateringPack: 'cateringPack',
  cateringOrders: 'cateringOrders',
  cateringOrder: 'cateringOrder',
};

// ============ CATERING PACKS HOOKS ============

export const useGetCateringPacks = (params: CateringPacksQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.cateringPacks, params],
    queryFn: () =>
      get<CateringPacksResponse>({
        url: 'catering/admin/packs',
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.category && { category: params.category }),
          ...(typeof params.isActive === 'boolean' && { isActive: params.isActive }),
        },
      }),
  });

export const useGetCateringPack = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.cateringPack, id],
    queryFn: () => get<CateringPackResponse>({ url: `catering/packs/${id}` }),
    enabled: !!id,
  });

export const useCreateCateringPack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CateringPackFormData) =>
      post<CateringPackResponse>({ url: 'catering/admin/packs', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.cateringPacks] });
    },
  });
};

export const useUpdateCateringPack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CateringPackFormData> }) =>
      put<CateringPackResponse>({ url: `catering/admin/packs/${id}`, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.cateringPacks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.cateringPack] });
    },
  });
};

export const useDeleteCateringPack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      deleteApi<{ success: boolean; message: string }>({ url: `catering/admin/packs/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.cateringPacks] });
    },
  });
};

// ============ CATERING ORDERS HOOKS ============

export const useGetCateringOrders = (params: CateringOrdersQueryParams = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.cateringOrders, params],
    queryFn: () =>
      get<CateringOrdersResponse>({
        url: 'catering/admin/orders',
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.deliveryStatus && { deliveryStatus: params.deliveryStatus }),
          ...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
        },
      }),
  });

export const useGetCateringOrder = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.cateringOrder, id],
    queryFn: () => get<CateringOrderResponse>({ url: `catering/admin/orders/${id}` }),
    enabled: !!id,
  });

export const useUpdateDeliveryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deliveryStatus }: { id: string; deliveryStatus: DeliveryStatus }) =>
      patch<CateringOrderResponse>({
        url: `catering/admin/orders/${id}/status`,
        body: { deliveryStatus },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.cateringOrders] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.cateringOrder] });
    },
  });
};
