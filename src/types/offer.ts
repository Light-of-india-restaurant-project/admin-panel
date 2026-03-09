// Offer Types
export interface Offer {
  _id: string
  name: string
  description: string
  descriptionNl: string
  price: number
  image?: string
  isActive: boolean
  sortOrder: number
  validFrom?: string
  validUntil?: string
  createdAt: string
  updatedAt: string
}

export interface OfferFormData {
  name: string
  description: string
  descriptionNl: string
  price: number
  image?: string
  isActive: boolean
  sortOrder: number
  validFrom?: string
  validUntil?: string
}

// Pagination Types
export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

// API Response Types
export interface OffersResponse {
  offers: Offer[]
  pagination: Pagination
}

// Query Params
export interface OfferQueryParams {
  [key: string]: unknown
  page?: number
  limit?: number
  search?: string
  isActive?: string
}
