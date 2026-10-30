export type EventReservationStatus = 'confirmed' | 'cancelled'

export interface EventReservation {
  _id: string
  name: string
  email: string
  contactNumber: string
  numberOfGuests: number
  reservationDate: string
  status: EventReservationStatus
  paymentId: string
  paymentStatus: string
  paymentMethod?: string
  amountPaid: number
  currency: string
  confirmationCode: string
  cancellationReason?: string
  adminNote?: string
  createdAt: string
  updatedAt: string
}

export interface EventSettings {
  _id: string
  titleEn: string
  titleNl: string
  subtitleEn: string
  subtitleNl: string
  descriptionEn: string
  descriptionNl: string
  timeEn: string
  timeNl: string
  locationEn: string
  locationNl: string
  host: string
  contactPhonePrimary: string
  contactPhoneSecondary: string
  contactEmail: string
  pricePerPerson: number
  currency: string
  eventDay: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
  maxAdvanceDays: number
  minGuestsPerReservation: number
  maxGuestsPerReservation: number
  skippedDates: string[]
  openDates: string[]
  restaurantClosedDates: Array<{
    date: string
    reason: string
  }>
  isActive: boolean
}

export interface EventReservationQueryParams {
  skip?: number
  limit?: number
  search?: string
  status?: EventReservationStatus
  startDate?: string
  endDate?: string
}

export interface EventReservationsResponse {
  message: string
  success: boolean
  data: EventReservation[]
  total: number
}

export interface SingleEventReservationResponse {
  message: string
  success: boolean
  data: EventReservation
}

export interface EventSettingsResponse {
  message: string
  success: boolean
  data: EventSettings
}
