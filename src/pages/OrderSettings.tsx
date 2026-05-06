import { useState, useEffect, useMemo, useCallback } from 'react'
import { get, patch } from '../api/client'
import { Settings, Truck, Store, CheckCircle, XCircle, Clock, Euro, Save, CalendarDays } from 'lucide-react'
import FormModal from '../components/FormModal'

interface RestaurantClosedDate {
  date: string
  reason: string
}

interface OrderSettingsData {
  deliveryEnabled: boolean
  pickupEnabled: boolean
  pickupStartTime: string
  pickupEndTime: string
  pickupInterval: number
  minimumOrderAmount: number
  deliveryCharge: number
  restaurantClosedDates?: RestaurantClosedDate[]
}

export default function OrderSettings() {
  const [settings, setSettings] = useState<OrderSettingsData>({
    deliveryEnabled: true,
    pickupEnabled: true,
    pickupStartTime: '16:00',
    pickupEndTime: '21:30',
    pickupInterval: 30,
    minimumOrderAmount: 0,
    deliveryCharge: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [draftMinimum, setDraftMinimum] = useState(0)
  const [draftDeliveryCharge, setDraftDeliveryCharge] = useState(0)
  const [restaurantClosedDates, setRestaurantClosedDates] = useState<RestaurantClosedDate[]>([])
  const [closureModalOpen, setClosureModalOpen] = useState(false)
  const [selectedClosureDate, setSelectedClosureDate] = useState<string | null>(null)
  const [closureReasonInput, setClosureReasonInput] = useState('')
  const [closureReasonError, setClosureReasonError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchSettings = async () => {
    try {
      const res = await get<{ success: boolean; data: OrderSettingsData }>({ url: 'reservations/settings' })
      setSettings({
        deliveryEnabled: res.data.deliveryEnabled ?? true,
        pickupEnabled: res.data.pickupEnabled ?? true,
        pickupStartTime: res.data.pickupStartTime ?? '16:00',
        pickupEndTime: res.data.pickupEndTime ?? '21:30',
        pickupInterval: res.data.pickupInterval ?? 30,
        minimumOrderAmount: res.data.minimumOrderAmount ?? 0,
        deliveryCharge: res.data.deliveryCharge ?? 0,
        restaurantClosedDates: res.data.restaurantClosedDates ?? [],
      })
      setDraftMinimum(res.data.minimumOrderAmount ?? 0)
      setDraftDeliveryCharge(res.data.deliveryCharge ?? 0)
      setRestaurantClosedDates(res.data.restaurantClosedDates ?? [])
    } catch (err) {
      console.error('Failed to fetch order settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (field: 'deliveryEnabled' | 'pickupEnabled') => {
    const newValue = !settings[field]

    // Prevent disabling both
    if (!newValue && !settings[field === 'deliveryEnabled' ? 'pickupEnabled' : 'deliveryEnabled']) {
      setNotification({ type: 'error', message: 'At least one order method must be enabled.' })
      return
    }

    setSaving(true)
    try {
      await patch({ url: 'reservations/admin/settings/order-settings', body: { [field]: newValue } })
      setSettings(prev => ({ ...prev, [field]: newValue }))
      setNotification({
        type: 'success',
        message: newValue
          ? `${field === 'deliveryEnabled' ? 'Delivery' : 'Pickup'} enabled`
          : `${field === 'deliveryEnabled' ? 'Delivery' : 'Pickup'} disabled`,
      })
    } catch {
      setNotification({ type: 'error', message: 'Failed to update setting.' })
    } finally {
      setSaving(false)
    }
  }

  const handlePickupTimeChange = async (field: 'pickupStartTime' | 'pickupEndTime' | 'pickupInterval', value: string | number) => {
    setSaving(true)
    try {
      await patch({ url: 'reservations/admin/settings/order-settings', body: { [field]: value } })
      setSettings(prev => ({ ...prev, [field]: value }))
      setNotification({ type: 'success', message: 'Pickup time updated' })
    } catch {
      setNotification({ type: 'error', message: 'Failed to update pickup time.' })
    } finally {
      setSaving(false)
    }
  }

  const previewTimeSlots = useMemo(() => {
    const slots: string[] = []
    const [startH, startM] = settings.pickupStartTime.split(':').map(Number)
    const [endH, endM] = settings.pickupEndTime.split(':').map(Number)
    let current = startH * 60 + startM
    const end = endH * 60 + endM
    while (current <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0')
      const m = (current % 60).toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
      current += settings.pickupInterval
    }
    return slots
  }, [settings.pickupStartTime, settings.pickupEndTime, settings.pickupInterval])

  const hasAmountChanges = draftMinimum !== settings.minimumOrderAmount || draftDeliveryCharge !== settings.deliveryCharge

  const handleSaveAmounts = useCallback(async () => {
    setSaving(true)
    try {
      await patch({ url: 'reservations/admin/settings/order-settings', body: { minimumOrderAmount: draftMinimum, deliveryCharge: draftDeliveryCharge } })
      setSettings(prev => ({ ...prev, minimumOrderAmount: draftMinimum, deliveryCharge: draftDeliveryCharge }))
      setNotification({ type: 'success', message: 'Order amount settings saved' })
    } catch {
      setNotification({ type: 'error', message: 'Failed to save order amount settings.' })
    } finally {
      setSaving(false)
    }
  }, [draftMinimum, draftDeliveryCharge])

  const toDateKey = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayKey = toDateKey(new Date())

  const closureReasonByDate = useMemo(() => {
    const map = new Map<string, string>()
    restaurantClosedDates.forEach((entry) => {
      const key = toDateKey(new Date(entry.date))
      map.set(key, entry.reason)
    })
    return map
  }, [restaurantClosedDates])

  const calendarDates = useMemo(() => {
    const result: Date[] = []
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    for (let i = 0; i < 60; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      result.push(date)
    }
    return result
  }, [])

  const saveRestaurantClosedDates = async (nextData: RestaurantClosedDate[]) => {
    setSaving(true)
    try {
      await patch({
        url: 'reservations/admin/settings/restaurant-closed-dates',
        body: { restaurantClosedDates: nextData },
      })
      setRestaurantClosedDates(nextData)
      setNotification({ type: 'success', message: 'Restaurant closure dates saved' })
    } catch {
      setNotification({ type: 'error', message: 'Failed to save restaurant closure dates.' })
    } finally {
      setSaving(false)
    }
  }

  const handleClosureDateClick = async (date: Date) => {
    const dateKey = toDateKey(date)

    if (dateKey < todayKey) {
      return
    }

    if (closureReasonByDate.has(dateKey)) {
      const nextData = restaurantClosedDates.filter((entry) => toDateKey(new Date(entry.date)) !== dateKey)
      await saveRestaurantClosedDates(nextData)
      return
    }

    setSelectedClosureDate(dateKey)
    setClosureReasonInput('')
    setClosureReasonError(null)
    setClosureModalOpen(true)
  }

  const handleSaveClosureReason = async () => {
    const reason = closureReasonInput.trim()
    if (!selectedClosureDate) return

    if (!reason) {
      setClosureReasonError('Reason is required')
      return
    }

    const nextData = [
      ...restaurantClosedDates.filter((entry) => toDateKey(new Date(entry.date)) !== selectedClosureDate),
      { date: selectedClosureDate, reason },
    ]

    setClosureModalOpen(false)
    setSelectedClosureDate(null)
    setClosureReasonInput('')
    setClosureReasonError(null)

    await saveRestaurantClosedDates(nextData)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {notification && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all ${
          notification.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium flex-1">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0">×</button>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-gray-700" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Store Settings</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Types</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Enable or disable delivery and pickup options for customers</p>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Delivery Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Delivery</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Allow customers to order for delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className={`text-sm font-medium ${settings.deliveryEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.deliveryEnabled ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={() => handleToggle('deliveryEnabled')}
                disabled={saving}
                className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full transition-colors disabled:opacity-50 ${
                  settings.deliveryEnabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white transition-transform shadow-md ${
                  settings.deliveryEnabled ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Pickup Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                <Store className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Pickup</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Allow customers to order for pickup</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className={`text-sm font-medium ${settings.pickupEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.pickupEnabled ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={() => handleToggle('pickupEnabled')}
                disabled={saving}
                className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full transition-colors disabled:opacity-50 ${
                  settings.pickupEnabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white transition-transform shadow-md ${
                  settings.pickupEnabled ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pickup Time Settings */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Pickup Time Settings</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Configure the available pickup time slots for customers</p>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Start Time */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Start Time</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Earliest pickup time available</p>
              </div>
            </div>
            <input
              type="time"
              value={settings.pickupStartTime}
              onChange={(e) => handlePickupTimeChange('pickupStartTime', e.target.value)}
              disabled={saving}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* End Time */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">End Time</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Latest pickup time available</p>
              </div>
            </div>
            <input
              type="time"
              value={settings.pickupEndTime}
              onChange={(e) => handlePickupTimeChange('pickupEndTime', e.target.value)}
              disabled={saving}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Time Interval */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Time Interval</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Gap between pickup time slots</p>
              </div>
            </div>
            <select
              value={settings.pickupInterval}
              onChange={(e) => handlePickupTimeChange('pickupInterval', Number(e.target.value))}
              disabled={saving}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          {/* Preview */}
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h4 className="text-sm font-semibold text-indigo-900 mb-3">Preview — Available Time Slots</h4>
            <div className="flex flex-wrap gap-2">
              {previewTimeSlots.map((slot) => (
                <span key={slot} className="px-3 py-1 bg-white border border-indigo-200 rounded-full text-sm text-indigo-700 font-medium">
                  {slot}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Amount Settings */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Amount Settings</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Set minimum order amount and delivery charges</p>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Minimum Order Amount */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Minimum Order Amount</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Minimum total required to place an order (set 0 to disable)</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-medium">€</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={draftMinimum}
                onChange={(e) => setDraftMinimum(parseFloat(e.target.value) || 0)}
                disabled={saving}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Delivery Charge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Delivery Charge</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Fee added to delivery orders (set 0 for free delivery)</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-medium">€</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={draftDeliveryCharge}
                onChange={(e) => setDraftDeliveryCharge(parseFloat(e.target.value) || 0)}
                disabled={saving}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveAmounts}
              disabled={!hasAmountChanges || saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                hasAmountChanges
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Restaurant Closure Calendar */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Restaurant Closed Dates</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Separate from Reservation Settings. Mark dates closed for all orders and reservations.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4" />
            <span>Click a date to close it (reason required). Click a closed date again to reopen.</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {calendarDates.map((date) => {
              const dateKey = toDateKey(date)
              const isPast = dateKey < todayKey
              const reason = closureReasonByDate.get(dateKey)
              const isClosed = !!reason

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleClosureDateClick(date)}
                  disabled={isPast || saving}
                  className={`p-2 rounded border text-left transition-colors ${
                    isPast
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      : isClosed
                      ? 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
                      : 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                  }`}
                  title={isClosed ? reason : undefined}
                >
                  <p className="text-xs font-semibold">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-[11px] opacity-80 mt-1">
                    {isPast ? 'Past' : isClosed ? 'Closed' : 'Open'}
                  </p>
                </button>
              )
            })}
          </div>

          <div className="flex gap-4 text-xs mt-4">
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 border border-green-200" /> Open</span>
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Closed (with reason)</span>
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Past date (read-only)</span>
          </div>
        </div>
      </div>

      <FormModal
        isOpen={closureModalOpen}
        onClose={() => {
          setClosureModalOpen(false)
          setSelectedClosureDate(null)
          setClosureReasonInput('')
          setClosureReasonError(null)
        }}
        title="Close Date - Enter Reason"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {selectedClosureDate ? `Closing date: ${selectedClosureDate}` : ''}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Reason *</label>
            <textarea
              value={closureReasonInput}
              onChange={(e) => {
                setClosureReasonInput(e.target.value)
                if (closureReasonError) setClosureReasonError(null)
              }}
              rows={4}
              maxLength={300}
              placeholder="Example: Closed for maintenance"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {closureReasonError && <p className="text-xs text-red-600 mt-1">{closureReasonError}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              onClick={() => {
                setClosureModalOpen(false)
                setSelectedClosureDate(null)
                setClosureReasonInput('')
                setClosureReasonError(null)
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              onClick={handleSaveClosureReason}
            >
              Save Closed Date
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  )
}
