import { useState, useEffect, useMemo } from 'react'
import { Clock, Calendar, Save, CalendarX } from 'lucide-react'
import {
  useGetBreakfastSettings,
  useUpdateBreakfastSettings,
  useUpdateBreakfastOperatingHours,
  useUpdateBreakfastReservationSettings,
  useUpdateBreakfastClosedDates,
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

const toLocalDateKey = (value: string | Date) => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function BreakfastSettings() {
  const { data, isLoading } = useGetBreakfastSettings()
  const updateAllSettingsMutation = useUpdateBreakfastSettings()
  const updateHoursMutation = useUpdateBreakfastOperatingHours()
  const updateSettingsMutation = useUpdateBreakfastReservationSettings()
  const updateClosedDatesMutation = useUpdateBreakfastClosedDates()

  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
  const [reservationDuration, setReservationDuration] = useState<number | null>(null)
  const [slotInterval, setSlotInterval] = useState<number | null>(null)
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number | null>(null)
  const [maxGuests, setMaxGuests] = useState<number | null>(null)
  const [minGuests, setMinGuests] = useState<number | null>(null)
  const [closedDates, setClosedDates] = useState<string[]>([])
  const [openDates, setOpenDates] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [pricePerPerson, setPricePerPerson] = useState<number>(14.95)
  const [currency, setCurrency] = useState('EUR')
  const [offerTitleEn, setOfferTitleEn] = useState('')
  const [offerTitleNl, setOfferTitleNl] = useState('')
  const [offerSubtitleEn, setOfferSubtitleEn] = useState('')
  const [offerSubtitleNl, setOfferSubtitleNl] = useState('')
  const [highlightItemsEnText, setHighlightItemsEnText] = useState('')
  const [highlightItemsNlText, setHighlightItemsNlText] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  useEffect(() => {
    if (data?.data) {
      setOperatingHours(data.data.operatingHours)
      setReservationDuration(data.data.reservationDuration)
      setSlotInterval(data.data.slotInterval)
      setMaxAdvanceDays(data.data.maxAdvanceDays)
      setMaxGuests(data.data.maxGuestsPerReservation)
      setMinGuests(data.data.minGuestsPerReservation)
      setClosedDates((data.data.closedDates || []).map((d: string | Date) => toLocalDateKey(d)))
      setOpenDates((data.data.openDates || []).map((d: string | Date) => toLocalDateKey(d)))
      setIsActive(data.data.isActive ?? true)
      setPricePerPerson(data.data.pricePerPerson ?? 14.95)
      setCurrency(data.data.currency ?? 'EUR')
      setOfferTitleEn(data.data.offerTitleEn ?? '')
      setOfferTitleNl(data.data.offerTitleNl ?? '')
      setOfferSubtitleEn(data.data.offerSubtitleEn ?? '')
      setOfferSubtitleNl(data.data.offerSubtitleNl ?? '')
      setHighlightItemsEnText((data.data.highlightItemsEn ?? []).join('\n'))
      setHighlightItemsNlText((data.data.highlightItemsNl ?? []).join('\n'))
      setIsDataLoaded(true)
    }
  }, [data])

  const toLineItems = (value: string): string[] =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

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
        dateStr: toLocalDateKey(date),
        dayName,
        isOpenByWeek: operatingHour?.isOpen ?? false,
      })
    }

    return dates
  }, [maxAdvanceDays, operatingHours])

  const handleHoursChange = (day: DayOfWeek, field: keyof OperatingHours, value: string | boolean) => {
    setOperatingHours(prev => prev.map(h => (h.day === day ? { ...h, [field]: value } : h)))
  }

  const handleToggleSpecificDate = (dateStr: string, isOpenByWeek: boolean) => {
    if (isOpenByWeek) {
      setClosedDates(prev => (prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]))
      setOpenDates(prev => prev.filter(d => d !== dateStr))
      return
    }

    setOpenDates(prev => (prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]))
    setClosedDates(prev => prev.filter(d => d !== dateStr))
  }

  const handleSaveHours = async () => {
    setError(null)
    setSuccessMessage(null)
    try {
      await updateHoursMutation.mutateAsync(operatingHours)
      setSuccessMessage('Breakfast operating hours saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save breakfast operating hours')
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
      setSuccessMessage('Breakfast booking settings saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save breakfast settings')
    }
  }

  const handleSaveClosedDates = async () => {
    setError(null)
    setSuccessMessage(null)
    try {
      await updateClosedDatesMutation.mutateAsync({ closedDates, openDates })
      setSuccessMessage('Breakfast specific date rules saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save breakfast specific date rules')
    }
  }

  const handleSaveOfferSettings = async () => {
    setError(null)
    setSuccessMessage(null)

    try {
      await updateAllSettingsMutation.mutateAsync({
        isActive,
        paymentMode: 'online',
        pricePerPerson,
        currency: currency.trim().toUpperCase(),
        offerTitleEn: offerTitleEn.trim(),
        offerTitleNl: offerTitleNl.trim(),
        offerSubtitleEn: offerSubtitleEn.trim(),
        offerSubtitleNl: offerSubtitleNl.trim(),
        highlightItemsEn: toLineItems(highlightItemsEnText),
        highlightItemsNl: toLineItems(highlightItemsNlText),
      })
      setSuccessMessage('Nashta/Brunch offer settings saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save nashta/brunch offer settings')
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading || !isDataLoaded) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center text-gray-500 py-8">Loading breakfast settings...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nashta/Brunch Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure nashta/brunch offer, payment and booking rules</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Nashta/Brunch Offer & Payment</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Offer is active
          </label>

          <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700">
            Payment Mode: Online only
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Person</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={pricePerPerson}
              onChange={(e) => setPricePerPerson(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Title (EN)</label>
            <input
              type="text"
              value={offerTitleEn}
              onChange={(e) => setOfferTitleEn(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Title (NL)</label>
            <input
              type="text"
              value={offerTitleNl}
              onChange={(e) => setOfferTitleNl(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Subtitle (EN)</label>
            <textarea
              value={offerSubtitleEn}
              onChange={(e) => setOfferSubtitleEn(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Subtitle (NL)</label>
            <textarea
              value={offerSubtitleNl}
              onChange={(e) => setOfferSubtitleNl(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Highlight Items (EN) - one per line</label>
            <textarea
              value={highlightItemsEnText}
              onChange={(e) => setHighlightItemsEnText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Highlight Items (NL) - one per line</label>
            <textarea
              value={highlightItemsNlText}
              onChange={(e) => setHighlightItemsNlText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          onClick={handleSaveOfferSettings}
          disabled={updateAllSettingsMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateAllSettingsMutation.isPending ? 'Saving...' : 'Save Nashta/Brunch Offer'}
        </button>
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

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Nashta/Brunch Booking Window</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Set how far in advance customers can make nashta/brunch reservations.
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
          <p className="mt-1 text-xs text-gray-500">How far ahead customers can book nashta/brunch</p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateSettingsMutation.isPending ? 'Saving...' : 'Save Nashta/Brunch Booking Window'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Nashta/Brunch Weekly Operating Hours</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Set the regular opening days and times used for nashta/brunch reservations.
        </p>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map(({ value, label }) => {
            const dayHours = operatingHours.find(h => h.day === value)
            if (!dayHours) return null

            return (
              <div key={value} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{label}</div>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dayHours.isOpen}
                    onChange={(e) => handleHoursChange(value, 'isOpen', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Open</span>
                </label>

                <input
                  type="time"
                  value={dayHours.openTime}
                  onChange={(e) => handleHoursChange(value, 'openTime', e.target.value)}
                  disabled={!dayHours.isOpen}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400"
                />

                <input
                  type="time"
                  value={dayHours.closeTime}
                  onChange={(e) => handleHoursChange(value, 'closeTime', e.target.value)}
                  disabled={!dayHours.isOpen}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400"
                />
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
          {updateHoursMutation.isPending ? 'Saving...' : 'Save Nashta/Brunch Hours'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarX className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Nashta/Brunch Specific Date Rules</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Override weekly schedule for specific dates. Toggle a date to switch it between open and closed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-2 border border-gray-200 rounded-lg">
          {allDates.map(({ date, dateStr, isOpenByWeek }) => {
            const isSpecificallyClosed = closedDates.includes(dateStr)
            const isSpecificallyOpen = openDates.includes(dateStr)
            const effectiveOpen = isOpenByWeek ? !isSpecificallyClosed : isSpecificallyOpen

            return (
              <button
                key={dateStr}
                onClick={() => handleToggleSpecificDate(dateStr, isOpenByWeek)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  effectiveOpen
                    ? 'bg-green-50 border-green-200 hover:bg-green-100'
                    : 'bg-red-50 border-red-200 hover:bg-red-100'
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{formatDate(date)}</div>
                <div className={`text-xs mt-1 ${effectiveOpen ? 'text-green-700' : 'text-red-700'}`}>
                  {effectiveOpen ? 'Open' : 'Closed'}
                  {!isOpenByWeek && isSpecificallyOpen && ' (Override)'}
                  {isOpenByWeek && isSpecificallyClosed && ' (Override)'}
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleSaveClosedDates}
          disabled={updateClosedDatesMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateClosedDatesMutation.isPending ? 'Saving...' : 'Save Nashta/Brunch Date Rules'}
        </button>
      </div>
    </div>
  )
}