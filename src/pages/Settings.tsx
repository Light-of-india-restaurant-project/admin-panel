import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Settings as SettingsIcon, Globe, CheckCircle, XCircle } from 'lucide-react'

export default function Settings() {
  const { token } = useAuth()
  const [globalManualMode, setGlobalManualMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    fetchGlobalManualMode()
  }, [])

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchGlobalManualMode = async () => {
    try {
      const response = await fetch('/api/admin/settings/global-manual-mode', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setGlobalManualMode(data.globalManualMode)
      }
    } catch (error) {
      console.error('Failed to fetch global manual mode:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGlobalToggle = async () => {
    setSaving(true)
    const newValue = !globalManualMode
    try {
      const response = await fetch('/api/admin/settings/global-manual-mode', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: newValue })
      })

      if (response.ok) {
        setGlobalManualMode(newValue)
        setNotification({
          type: 'success',
          message: newValue 
            ? 'Global Manual Mode enabled - All connection requests are now disabled'
            : 'Global Manual Mode disabled - Users can now send connection requests'
        })
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to update setting. Please try again.'
        })
      }
    } catch (error) {
      console.error('Failed to toggle global manual mode:', error)
      setNotification({
        type: 'error',
        message: 'Network error. Please check your connection.'
      })
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
      {/* Notification Toast */}
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
          <button 
            onClick={() => setNotification(null)}
            className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-700" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Connection Settings Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 sm:mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Connection Settings</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Control how users can connect with each other</p>
        </div>

        <div className="p-4 sm:p-6">
          {/* Global Manual Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Global Manual Mode</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  When enabled, all users must wait for admin approval before sending connection requests
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <button
                onClick={handleGlobalToggle}
                disabled={saving}
                className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full transition-colors disabled:opacity-50 ${
                  globalManualMode ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white transition-transform shadow-md ${
                    globalManualMode ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold min-w-[35px] ${globalManualMode ? 'text-green-600' : 'text-gray-500'}`}>
                {globalManualMode ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {globalManualMode && (
            <div className="mt-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs sm:text-sm text-amber-800">
                <strong>Note:</strong> Connection requests are currently disabled for all users. You can still enable/disable per-user in the Users page.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Future Settings Sections - Placeholder */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden opacity-60">
        <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">More Settings Coming Soon</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Additional configuration options will be available here</p>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">Future settings will appear here...</p>
        </div>
      </div>
    </div>
  )
}
