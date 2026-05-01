import { useState, useEffect, useMemo } from 'react'
import { Clock, Calendar, Save, CalendarX } from 'lucide-react'
import {
  useGetRestaurantSettings,
  useUpdateOperatingHours,
  useUpdateReservationSettings,
  useUpdateClosedDates,
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

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export default function ReservationSettings() {
  const { data, isLoading } = useGetRestaurantSettings()
  const updateHoursMutation = useUpdateOperatingHours()
  const updateSettingsMutation = useUpdateReservationSettings()
  const updateClosedDatesMutation = useUpdateClosedDates()

  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  const [reservationDuration, setReservationDuration] = useState<number | null>(null)
  const [slotInterval, setSlotInterval] = useState<number | null>(null)
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number | null>(null)
  const [maxGuests, setMaxGuests] = useState<number | null>(null)
  const [minGuests, setMinGuests] = useState<number | null>(null)
  const [closedDates, setClosedDates] = useState<string[]>([])
  const [openDates, setOpenDates] = useState<string[]>([])
  
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
      // Convert dates to ISO strings for comparison
      setClosedDates((data.data.closedDates || []).map((d: string | Date) => 
        new Date(d).toISOString().split('T')[0]
      ))
      setOpenDates((data.data.openDates || []).map((d: string | Date) =>
        new Date(d).toISOString().split('T')[0]
      ))
      setIsDataLoaded(true)
    }
  }, [data])

  // Generate all dates within maxAdvanceDays
  const allDates = useMemo(() => {
    if (!maxAdvanceDays || !operatingHours.length) return []
    
    const dates: { date: Date; dateStr: string; dayName: string; isOpenByWeek: boolean }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < maxAdvanceDays; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dayIndex = date.getDay()
      const dayName = DAY_NAMES[dayIndex]
      const operatingHour = operatingHours.find(h => h.day === dayName)
      
      dates.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        dayName,
        isOpenByWeek: operatingHour?.isOpen ?? false,
      })
    }
    
    return dates
  }, [maxAdvanceDays, operatingHours])

  const handleHoursChange = (day: DayOfWeek, field: keyof OperatingHours, value: string | boolean) => {
    setOperatingHours(prev => prev.map(h => 
      h.day === day ? { ...h, [field]: value } : h
    ))
  }

  const handleToggleSpecificDate = (dateStr: string, isOpenByWeek: boolean) => {
    if (isOpenByWeek) {
      setClosedDates(prev =>
        prev.includes(dateStr)
          ? prev.filter(d => d !== dateStr)
          : [...prev, dateStr]
      )

      // Remove stale open override if weekly hours are already open.
      setOpenDates(prev => prev.filter(d => d !== dateStr))
      return
    }

    setOpenDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    )

    // A weekly-closed date should not also be marked as specifically closed.
    setClosedDates(prev => prev.filter(d => d !== dateStr))
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
    
    if (maxAdvanceDays === null) {
      setError('Please fill in all fields')
      return
    }
    
    try {
      await updateSettingsMutation.mutateAsync({
        reservationDuration: reservationDuration ?? 60,
        slotInterval: slotInterval ?? 30,
        maxAdvanceDays,
        maxGuestsPerReservation: maxGuests ?? 10,
        minGuestsPerReservation: minGuests ?? 1,
      })
      setSuccessMessage('Reservation settings saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    }
  }

  const handleSaveClosedDates = async () => {
    setError(null)
    setSuccessMessage(null)
    try {
      await updateClosedDatesMutation.mutateAsync({ closedDates, openDates })
      setSuccessMessage('Specific date rules saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save specific date rules')
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
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

      {/* Reservation Settings Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Booking Window</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Set how far in advance customers can make reservations.
        </p>

        <div className="max-w-xs">
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

        <button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateSettingsMutation.isPending ? 'Saving...' : 'Save Booking Window'}
        </button>
      </div>

      {/* Operating Hours Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Weekly Operating Hours</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Set the regular opening days and times for each day of the week.
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

      {/* Specific Closed Dates Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarX className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Manage Specific Dates</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Click any date to override weekly schedule. Weekly-open dates can be marked closed,
          and weekly-closed dates can be opened for specific dates.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {allDates.map(({ date, dateStr, dayName, isOpenByWeek }) => {
            const isClosedSpecifically = closedDates.includes(dateStr)
            const isOpenSpecifically = openDates.includes(dateStr)
            const finalIsOpen = (isOpenByWeek || isOpenSpecifically) && !isClosedSpecifically

            const tileClasses = !isOpenByWeek && !isOpenSpecifically
              ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              : isClosedSpecifically
              ? 'bg-red-100 border-2 border-red-300 text-red-800 hover:bg-red-200'
              : !isOpenByWeek && isOpenSpecifically
              ? 'bg-blue-50 border-2 border-blue-300 text-blue-800 hover:bg-blue-100'
              : 'bg-green-50 border border-green-200 text-green-800 hover:bg-green-100'
            
            return (
              <button
                key={dateStr}
                onClick={() => handleToggleSpecificDate(dateStr, isOpenByWeek)}
                className={`p-2 rounded-lg text-sm text-left transition-all ${tileClasses}`}
                title={
                  isClosedSpecifically 
                    ? 'Click to re-open this date'
                    : !isOpenByWeek && !isOpenSpecifically
                    ? `Closed on ${dayName}s (weekly schedule). Click to open this date.`
                    : !isOpenByWeek && isOpenSpecifically
                    ? 'Open for this date only. Click to remove override.'
                    : 'Click to close this date'
                }
              >
                <div className="font-medium">{formatDate(date)}</div>
                <div className="text-xs mt-0.5">
                  {isClosedSpecifically
                    ? 'Closed' 
                    : !isOpenByWeek && isOpenSpecifically
                    ? 'Open (specific)'
                    : !isOpenByWeek
                    ? 'Weekly closed'
                    : finalIsOpen ? 'Open' : 'Closed'}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
            <span>Closed (specific)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
            <span>Open (specific)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>Closed (weekly)</span>
          </div>
        </div>

        <button
          onClick={handleSaveClosedDates}
          disabled={updateClosedDatesMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateClosedDatesMutation.isPending ? 'Saving...' : 'Save Closed Dates'}
        </button>
      </div>
    </div>
  )
}
