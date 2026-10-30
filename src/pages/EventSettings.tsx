import { useEffect, useState } from 'react'
import { Calendar, Save } from 'lucide-react'
import { useGetEventSettings, useUpdateEventSettings } from '@/hooks/useEventReservations'

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

interface RestaurantClosedDate {
  date: string
  reason: string
}

const toDateInput = (value: string | Date) => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const splitDateText = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const toLocalDateKey = (value: string | Date) => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (value: Date) =>
  value.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

export default function EventSettings() {
  const { data, isLoading } = useGetEventSettings()
  const updateMutation = useUpdateEventSettings()

  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [skippedText, setSkippedText] = useState('')
  const [openText, setOpenText] = useState('')
  const [skippedDates, setSkippedDates] = useState<string[]>([])
  const [openDates, setOpenDates] = useState<string[]>([])
  const [restaurantClosedDates, setRestaurantClosedDates] = useState<RestaurantClosedDate[]>([])
  const [closeReason, setCloseReason] = useState('')
  const [dateToClose, setDateToClose] = useState<string | null>(null)
  const [dateRuleError, setDateRuleError] = useState<string | null>(null)

  useEffect(() => {
    if (!data?.data) return

    const settings = data.data
    setFormData({
      titleEn: settings.titleEn,
      titleNl: settings.titleNl,
      subtitleEn: settings.subtitleEn,
      subtitleNl: settings.subtitleNl,
      descriptionEn: settings.descriptionEn,
      descriptionNl: settings.descriptionNl,
      timeEn: settings.timeEn,
      timeNl: settings.timeNl,
      locationEn: settings.locationEn,
      locationNl: settings.locationNl,
      host: settings.host,
      contactPhonePrimary: settings.contactPhonePrimary,
      contactPhoneSecondary: settings.contactPhoneSecondary,
      contactEmail: settings.contactEmail,
      pricePerPerson: settings.pricePerPerson,
      currency: settings.currency,
      eventDay: settings.eventDay,
      maxAdvanceDays: settings.maxAdvanceDays,
      minGuestsPerReservation: settings.minGuestsPerReservation,
      maxGuestsPerReservation: settings.maxGuestsPerReservation,
      isActive: settings.isActive,
    })

    setSkippedText((settings.skippedDates || []).map((date) => toDateInput(date)).join('\n'))
    setOpenText((settings.openDates || []).map((date) => toDateInput(date)).join('\n'))
    setSkippedDates((settings.skippedDates || []).map((date) => toLocalDateKey(date)))
    setOpenDates((settings.openDates || []).map((date) => toLocalDateKey(date)))
    setRestaurantClosedDates(
      ((settings.restaurantClosedDates || []) as Array<{ date: string | Date; reason: string }>).map((entry) => ({
        date: toLocalDateKey(entry.date),
        reason: entry.reason,
      })),
    )
  }, [data])

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      ...formData,
      skippedDates: Array.from(new Set([...splitDateText(skippedText), ...skippedDates])),
      openDates: Array.from(new Set([...splitDateText(openText), ...openDates])),
      restaurantClosedDates,
    })
  }

  const persistDateRules = async ({
    nextSkippedDates,
    nextOpenDates,
    nextRestaurantClosedDates,
  }: {
    nextSkippedDates: string[]
    nextOpenDates: string[]
    nextRestaurantClosedDates: RestaurantClosedDate[]
  }) => {
    setDateRuleError(null)

    try {
      await updateMutation.mutateAsync({
        skippedDates: nextSkippedDates,
        openDates: nextOpenDates,
        restaurantClosedDates: nextRestaurantClosedDates,
      })

      setSkippedDates(nextSkippedDates)
      setOpenDates(nextOpenDates)
      setRestaurantClosedDates(nextRestaurantClosedDates)
      setSkippedText(nextSkippedDates.join('\n'))
      setOpenText(nextOpenDates.join('\n'))
    } catch (err) {
      setDateRuleError(err instanceof Error ? err.message : 'Failed to save date rules')
    }
  }

  const eventDay = ((formData.eventDay as string) || 'sunday').toLowerCase()
  const maxAdvanceDays = Number(formData.maxAdvanceDays || 90)

  const allDates = Array.from({ length: maxAdvanceDays }, (_, idx) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + idx)

    const dateStr = toLocalDateKey(date)
    const dayName = DAY_NAMES[date.getDay()]
    const isWeeklyEventDay = dayName === eventDay
    const isOpenOverride = openDates.includes(dateStr)
    const isSkipped = skippedDates.includes(dateStr)
    const closedEntry = restaurantClosedDates.find((item) => item.date === dateStr)

    return {
      date,
      dateStr,
      isWeeklyEventDay,
      isOpenOverride,
      isSkipped,
      closedEntry,
      effectiveOpen: (isWeeklyEventDay || isOpenOverride) && !isSkipped && !closedEntry,
    }
  })

  const handleDateTileClick = async ({
    dateStr,
    isWeeklyEventDay,
    isOpenOverride,
    isSkipped,
    closedEntry,
  }: {
    dateStr: string
    isWeeklyEventDay: boolean
    isOpenOverride: boolean
    isSkipped: boolean
    closedEntry: RestaurantClosedDate | undefined
  }) => {
    if (updateMutation.isPending) return

    if (closedEntry) {
      const nextRestaurantClosedDates = restaurantClosedDates.filter((entry) => entry.date !== dateStr)
      await persistDateRules({
        nextSkippedDates: skippedDates,
        nextOpenDates: openDates,
        nextRestaurantClosedDates,
      })
      return
    }

    if (isWeeklyEventDay) {
      const nextSkippedDates = isSkipped ? skippedDates.filter((d) => d !== dateStr) : [...skippedDates, dateStr]
      const nextOpenDates = openDates.filter((d) => d !== dateStr)

      await persistDateRules({
        nextSkippedDates: Array.from(new Set(nextSkippedDates)),
        nextOpenDates: Array.from(new Set(nextOpenDates)),
        nextRestaurantClosedDates: restaurantClosedDates,
      })
      return
    }

    const nextOpenDates = isOpenOverride ? openDates.filter((d) => d !== dateStr) : [...openDates, dateStr]
    const nextSkippedDates = skippedDates.filter((d) => d !== dateStr)

    await persistDateRules({
      nextSkippedDates: Array.from(new Set(nextSkippedDates)),
      nextOpenDates: Array.from(new Set(nextOpenDates)),
      nextRestaurantClosedDates: restaurantClosedDates,
    })
  }

  const saveClosedDate = async () => {
    if (!dateToClose) return
    const reason = closeReason.trim()
    if (!reason) return

    const nextRestaurantClosedDates = [
      ...restaurantClosedDates.filter((entry) => entry.date !== dateToClose),
      { date: dateToClose, reason },
    ]

    await persistDateRules({
      nextSkippedDates: skippedDates,
      nextOpenDates: openDates,
      nextRestaurantClosedDates,
    })

    setDateToClose(null)
    setCloseReason('')
  }

  if (isLoading) {
    return <div className="p-6">Loading event settings...</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Upcoming Event Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage weekly event details, Sunday schedule, and skipped dates.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        {dateRuleError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {dateRuleError}
          </div>
        )}

        <div className="border-b border-gray-200 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">Event Content</h2>
          <p className="text-sm text-gray-500 mt-1">Edit event title and description shown on the website.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Title (EN)
            <input
              value={(formData.titleEn as string) || ''}
              onChange={(e) => handleChange('titleEn', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Title (EN)"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Title (NL)
            <input
              value={(formData.titleNl as string) || ''}
              onChange={(e) => handleChange('titleNl', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Title (NL)"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Subtitle (EN)
            <input
              value={(formData.subtitleEn as string) || ''}
              onChange={(e) => handleChange('subtitleEn', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Subtitle (EN)"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Subtitle (NL)
            <input
              value={(formData.subtitleNl as string) || ''}
              onChange={(e) => handleChange('subtitleNl', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Subtitle (NL)"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Description (EN)
            <textarea
              value={(formData.descriptionEn as string) || ''}
              onChange={(e) => handleChange('descriptionEn', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Description (EN)"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Description (NL)
            <textarea
              value={(formData.descriptionNl as string) || ''}
              onChange={(e) => handleChange('descriptionNl', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Description (NL)"
            />
          </label>
        </div>

        <div className="border-b border-gray-200 pb-3 pt-2">
          <h2 className="text-lg font-semibold text-gray-900">Timing & Location</h2>
          <p className="text-sm text-gray-500 mt-1">Set event schedule and where it takes place.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Time (EN)
            <input
              value={(formData.timeEn as string) || ''}
              onChange={(e) => handleChange('timeEn', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Time (EN)"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Time (NL)
            <input
              value={(formData.timeNl as string) || ''}
              onChange={(e) => handleChange('timeNl', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Time (NL)"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Weekly Event Day
            <select
              value={(formData.eventDay as string) || 'sunday'}
              onChange={(e) => handleChange('eventDay', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Location (EN)
            <input
              value={(formData.locationEn as string) || ''}
              onChange={(e) => handleChange('locationEn', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Location (EN)"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Location (NL)
            <input
              value={(formData.locationNl as string) || ''}
              onChange={(e) => handleChange('locationNl', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Location (NL)"
            />
          </label>
        </div>

        <div className="border-b border-gray-200 pb-3 pt-2">
          <h2 className="text-lg font-semibold text-gray-900">Contact & Pricing</h2>
          <p className="text-sm text-gray-500 mt-1">Set host, contact details and reservation limits.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Host
            <input
              value={(formData.host as string) || ''}
              onChange={(e) => handleChange('host', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Host"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Primary Phone
            <input
              value={(formData.contactPhonePrimary as string) || ''}
              onChange={(e) => handleChange('contactPhonePrimary', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Primary phone"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Secondary Phone
            <input
              value={(formData.contactPhoneSecondary as string) || ''}
              onChange={(e) => handleChange('contactPhoneSecondary', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Secondary phone"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Contact Email
            <input
              type="email"
              value={(formData.contactEmail as string) || ''}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Contact email"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Price Per Person
            <input
              type="number"
              step="0.01"
              min={0.01}
              value={(formData.pricePerPerson as number) || 0}
              onChange={(e) => handleChange('pricePerPerson', Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Price per person"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Max Advance Days
            <input
              type="number"
              min={1}
              max={365}
              value={(formData.maxAdvanceDays as number) || 90}
              onChange={(e) => handleChange('maxAdvanceDays', Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Max advance days"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Event Status
            <select
              value={String((formData.isActive as boolean) ?? true)}
              onChange={(e) => handleChange('isActive', e.target.value === 'true')}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Min Guests Per Reservation
            <input
              type="number"
              min={1}
              max={20}
              value={(formData.minGuestsPerReservation as number) || 1}
              onChange={(e) => handleChange('minGuestsPerReservation', Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Max Guests Per Reservation
            <input
              type="number"
              min={1}
              max={100}
              value={(formData.maxGuestsPerReservation as number) || 20}
              onChange={(e) => handleChange('maxGuestsPerReservation', Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
        </div>

        <div className="border-b border-gray-200 pb-3 pt-2">
          <h2 className="text-lg font-semibold text-gray-900">Date Rules</h2>
          <p className="text-sm text-gray-500 mt-1">Manage date-by-date open, skip, and fully closed dates.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {allDates.map(({ date, dateStr, isWeeklyEventDay, isOpenOverride, isSkipped, closedEntry, effectiveOpen }) => (
            <button
              type="button"
              key={dateStr}
              onClick={() => void handleDateTileClick({ dateStr, isWeeklyEventDay, isOpenOverride, isSkipped, closedEntry })}
              className={`p-2 rounded-lg text-left transition-all border ${
                closedEntry
                  ? 'bg-red-50 border-red-300 text-red-900 hover:bg-red-100'
                  : effectiveOpen
                  ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                  : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
              }`}
              disabled={updateMutation.isPending}
              title={
                closedEntry
                  ? `Closed: ${closedEntry.reason}. Click to reopen.`
                  : isWeeklyEventDay
                  ? isSkipped
                    ? 'Skipped weekly event date. Click to reopen.'
                    : 'Weekly event date. Click to skip this date.'
                  : isOpenOverride
                  ? 'Extra open date. Click to remove open override.'
                  : 'Weekly non-event date. Click to open this date.'
              }
            >
              <div className="font-medium text-sm">{formatDate(date)}</div>
              <div className="text-xs mt-1">
                {closedEntry
                  ? 'Closed (restaurant)'
                  : isWeeklyEventDay && isSkipped
                  ? 'Skipped weekly event'
                  : isWeeklyEventDay
                  ? 'Weekly event day'
                  : isOpenOverride
                  ? 'Open override'
                  : 'Not open'}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          <div className="text-sm font-semibold text-gray-900">Close Specific Date (Restaurant Closed)</div>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="date"
              value={dateToClose || ''}
              onChange={(e) => setDateToClose(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="Reason (required)"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={() => void saveClosedDate()}
              disabled={!dateToClose || !closeReason.trim() || updateMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Close Date
            </button>
          </div>
          <p className="text-xs text-gray-500">Closed dates block reservations even if the weekly event is active.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Weekly Skip Dates (manual list)
            <textarea
              value={skippedText}
              onChange={(e) => setSkippedText(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={5}
              placeholder="YYYY-MM-DD, one per line"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Extra Open Dates (manual list)
            <textarea
              value={openText}
              onChange={(e) => setOpenText(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={5}
              placeholder="YYYY-MM-DD, one per line"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Event Settings'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Click a weekly event day to skip it, click a non-event day to open it, and use "Close Date" for full closure with reason.
      </div>
    </div>
  )
}
