// Table Types
export interface Table {
  _id: string
  name: string
  capacity: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TableFormData {
  name: string
  capacity: number
  description?: string
  isActive: boolean
}

// Reservation Status
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'

// Reservation Types
export interface Reservation {
  _id: string
  name: string
  email: string
  phone: string
  date: string
  time: string
  endTime: string
  guests: number
  tableId: Table | string
  userId?: string
  status: ReservationStatus
  confirmationCode: string
  specialRequests?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export interface ReservationFormData {
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  specialRequests?: string
}

export interface ReservationUpdateData {
  name?: string
  email?: string
  phone?: string
  date?: string
  time?: string
  endTime?: string
  guests?: number
  tableId?: string
  status?: ReservationStatus
  specialRequests?: string
  adminNotes?: string
}

// Operating Hours
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'

export interface OperatingHours {
  day: DayOfWeek
  isOpen: boolean
  openTime: string
  closeTime: string
}

// Restaurant Settings
export interface RestaurantSettings {
  _id: string
  operatingHours: OperatingHours[]
  reservationDuration: number
  slotInterval: number
  maxAdvanceDays: number
  maxGuestsPerReservation: number
  minGuestsPerReservation: number
  createdAt: string
  updatedAt: string
}

export interface RestaurantSettingsFormData {
  operatingHours?: OperatingHours[]
  reservationDuration?: number
  slotInterval?: number
  maxAdvanceDays?: number
  maxGuestsPerReservation?: number
  minGuestsPerReservation?: number
}

// Query Params
export interface TableQueryParams {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface ReservationQueryParams {
  search?: string
  status?: ReservationStatus
  date?: string
  page?: number
  limit?: number
}

// Pagination
export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

// API Responses
export interface TablesResponse {
  message: string
  success: boolean
  data: Table[]
  pagination: Pagination
}

export interface SingleTableResponse {
  message: string
  success: boolean
  data: Table
}

export interface ReservationsResponse {
  message: string
  success: boolean
  data: Reservation[]
  pagination: Pagination
}

export interface SingleReservationResponse {
  message: string
  success: boolean
  data: Reservation
}

export interface RestaurantSettingsResponse {
  message: string
  success: boolean
  data: RestaurantSettings
}

// Available Slots (for frontend)
export interface AvailableSlot {
  time: string
  tables: Array<{
    id: string
    name: string
    capacity: number
  }>
}

export interface AvailableSlotsResponse {
  message: string
  success: boolean
  data: AvailableSlot[]
}
