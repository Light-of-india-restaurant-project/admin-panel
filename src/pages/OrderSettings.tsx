import { useState, useEffect } from 'react'
import { get, patch } from '../api/client'
import { Settings, Truck, Store, CheckCircle, XCircle } from 'lucide-react'

interface OrderSettingsData {
  deliveryEnabled: boolean
  pickupEnabled: boolean
}

export default function OrderSettings() {
  const [settings, setSettings] = useState<OrderSettingsData>({ deliveryEnabled: true, pickupEnabled: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
      })
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
    </div>
  )
}
