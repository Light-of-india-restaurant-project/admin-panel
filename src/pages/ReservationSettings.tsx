import { useState, useEffect } from 'react'
import { Clock, Calendar, Users, Save } from 'lucide-react'
import {
  useGetRestaurantSettings,
  useUpdateOperatingHours,
  useUpdateReservationSettings,
} from '@/hooks/useReservations'
import type { OperatingHours, DayOfWeek } from '@/types/reservation'

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
]

const SLOT_INTERVALS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
]

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
]

export default function ReservationSettings() {
  const { data, isLoading } = useGetRestaurantSettings()
  const updateHoursMutation = useUpdateOperatingHours()
  const updateSettingsMutation = useUpdateReservationSettings()

  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  const [reservationDuration, setReservationDuration] = useState<number | null>(null)
  const [slotInterval, setSlotInterval] = useState<number | null>(null)
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number | null>(null)
  const [maxGuests, setMaxGuests] = useState<number | null>(null)
  const [minGuests, setMinGuests] = useState<number | null>(null)
  
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Track if data has been loaded
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Load initial data
  useEffect(() => {
    if (data?.data) {
      setOperatingHours(data.data.operatingHours)
      setReservationDuration(data.data.reservationDuration)
      setSlotInterval(data.data.slotInterval)
      setMaxAdvanceDays(data.data.maxAdvanceDays)
      setMaxGuests(data.data.maxGuestsPerReservation)
      setMinGuests(data.data.minGuestsPerReservation)
      setIsDataLoaded(true)
    }
  }, [data])

  const handleHoursChange = (day: DayOfWeek, field: keyof OperatingHours, value: string | boolean) => {
    setOperatingHours(prev => prev.map(h => 
      h.day === day ? { ...h, [field]: value } : h
    ))
  }

  const handleSaveHours = async () => {
    setError(null)
    setSuccessMessage(null)
    try {
      await updateHoursMutation.mutateAsync(operatingHours)
      setSuccessMessage('Operating hours saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save operating hours')
    }
  }

  const handleSaveSettings = async () => {
    setError(null)
    setSuccessMessage(null)
    
    if (reservationDuration === null || slotInterval === null || maxAdvanceDays === null || 
        maxGuests === null || minGuests === null) {
      setError('Please fill in all fields')
      return
    }
    
    try {
      await updateSettingsMutation.mutateAsync({
        reservationDuration,
        slotInterval,
        maxAdvanceDays,
        maxGuestsPerReservation: maxGuests,
        minGuestsPerReservation: minGuests,
      })
      setSuccessMessage('Reservation settings saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    }
  }

  if (isLoading || !isDataLoaded) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center text-gray-500 py-8">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reservation Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure operating hours and reservation rules</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-900 font-medium">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Operating Hours Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Operating Hours</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Set the opening and closing times for each day of the week. These times determine when reservations can be made.
        </p>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map(({ value, label }) => {
            const dayHours = operatingHours.find(h => h.day === value)
            if (!dayHours) return null
            
            return (
              <div 
                key={value} 
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border ${
                  dayHours.isOpen ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-[140px]">
                  <input
                    type="checkbox"
                    id={`open-${value}`}
                    checked={dayHours.isOpen}
                    onChange={(e) => handleHoursChange(value, 'isOpen', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label 
                    htmlFor={`open-${value}`}
                    className={`font-medium ${dayHours.isOpen ? 'text-gray-900' : 'text-gray-400'}`}
                  >
                    {label}
                  </label>
                </div>
                
                {dayHours.isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={dayHours.openTime}
                      onChange={(e) => handleHoursChange(value, 'openTime', e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={dayHours.closeTime}
                      onChange={(e) => handleHoursChange(value, 'closeTime', e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Closed</span>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={handleSaveHours}
          disabled={updateHoursMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateHoursMutation.isPending ? 'Saving...' : 'Save Operating Hours'}
        </button>
      </div>

      {/* Reservation Settings Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Reservation Rules</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Configure how reservations work - duration, time slots, and guest limits.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reservation Duration
            </label>
            <select
              value={reservationDuration ?? ''}
              onChange={(e) => setReservationDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {DURATION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">How long each reservation blocks a table</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Slot Interval
            </label>
            <select
              value={slotInterval ?? ''}
              onChange={(e) => setSlotInterval(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {SLOT_INTERVALS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Gap between available booking times</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Advance Booking (days)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={maxAdvanceDays ?? ''}
              onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">How far ahead customers can book</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Guest Limits
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Minimum</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={minGuests ?? ''}
                  onChange={(e) => setMinGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Maximum</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxGuests ?? ''}
                  onChange={(e) => setMaxGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Min/max guests allowed per reservation</p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateSettingsMutation.isPending ? 'Saving...' : 'Save Reservation Settings'}
        </button>
      </div>
    </div>
  )
}
