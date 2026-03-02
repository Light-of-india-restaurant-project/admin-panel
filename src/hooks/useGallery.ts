import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put, deleteApi } from '@/api/client'
import { QUERY_KEYS } from '@/constants/config'

// Gallery image interface
export interface GalleryImage {
  _id: string
  title: string
  titleNl: string
  alt: string
  altNl: string
  category: 'food' | 'ambiance'
  imageUrl: string
  section: 1 | 2
  isFeatured: boolean
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Form data interface
export interface GalleryFormData {
  title: string
  titleNl: string
  alt: string
  altNl: string
  category: 'food' | 'ambiance'
  imageUrl: string
  section: 1 | 2
  isFeatured?: boolean
  sortOrder?: number
  isActive: boolean
}

// API response interface
interface GalleryResponse {
  success: boolean
  message?: string
  images: GalleryImage[]
}

interface SingleGalleryResponse {
  success: boolean
  message?: string
  image: GalleryImage
}

// Get all gallery images (admin)
export const useGetGalleryImages = () =>
  useQuery({
    queryKey: [QUERY_KEYS.gallery],
    queryFn: () => get<GalleryResponse>({ url: 'gallery/admin' }),
  })

// Get single gallery image
export const useGetGalleryImage = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.gallery, id],
    queryFn: () => get<SingleGalleryResponse>({ url: `gallery/admin/${id}` }),
    enabled: !!id,
  })

// Create gallery image
export const useCreateGalleryImage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: GalleryFormData) => 
      post<SingleGalleryResponse>({ url: 'gallery/admin', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gallery] })
    },
  })
}

// Update gallery image
export const useUpdateGalleryImage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GalleryFormData> }) =>
      put<SingleGalleryResponse>({ url: `gallery/admin/${id}`, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gallery] })
    },
  })
}

// Delete gallery image
export const useDeleteGalleryImage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      deleteApi<{ message: string }>({ url: `gallery/admin/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gallery] })
    },
  })
}

// Set featured image for a section
export const useSetFeaturedImage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, section }: { id: string; section: 1 | 2 }) => 
      post<SingleGalleryResponse>({ url: 'gallery/admin/set-featured', body: { id, section } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gallery] })
    },
  })
}
