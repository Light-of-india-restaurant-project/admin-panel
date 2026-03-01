// Location Type
export type LocationType = 'inside' | 'outside' | 'terrace'

// Floor Types
export interface Floor {
  _id: string
  name: string
  floorNumber: number
  locationType: LocationType
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FloorFormData {
  name: string
  floorNumber: number
  locationType: LocationType
  description?: string
  isActive: boolean
}

// Row Types
export interface Row {
  _id: string
  name: string
  rowNumber: number
  floor: Floor | string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RowFormData {
  name: string
  rowNumber: number
  floor: string
  description?: string
  isActive: boolean
}

// Table Types
export interface Table {
  _id: string
  name: string
  capacity: number
  floor?: Floor | string
  row?: Row | string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TableFormData {
  name: string
  capacity: number
  floor?: string
  row?: string
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
  closedDates: string[]
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
export interface FloorQueryParams {
  search?: string
  isActive?: boolean | string
  locationType?: LocationType | string
  page?: number
  limit?: number
}

export interface RowQueryParams {
  search?: string
  isActive?: boolean | string
  floor?: string
  page?: number
  limit?: number
}

export interface TableQueryParams {
  search?: string
  isActive?: boolean | string
  floor?: string
  row?: string
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
export interface FloorsResponse {
  message: string
  success: boolean
  data: Floor[]
  pagination: Pagination
}

export interface SingleFloorResponse {
  message: string
  success: boolean
  data: Floor
}

export interface RowsResponse {
  message: string
  success: boolean
  data: Row[]
  pagination: Pagination
}

export interface SingleRowResponse {
  message: string
  success: boolean
  data: Row
}

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

// Simple Reservation Types
export type SimpleReservationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface SimpleReservation {
  _id: string
  name: string
  email: string
  contactNumber: string
  numberOfGuests: number
  reservationDate: string
  status: SimpleReservationStatus
  rejectionReason?: string
  cancellationReason?: string
  adminNote?: string
  createdAt: string
  updatedAt: string
}

export interface SimpleReservationResponse {
  message: string
  success: boolean
  data: SimpleReservation[]
  total: number
}

export interface SingleSimpleReservationResponse {
  message: string
  success: boolean
  data: SimpleReservation
}
