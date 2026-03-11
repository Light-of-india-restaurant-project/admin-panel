import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '@/constants/config'
import { 
  Tag, 
  Truck, 
  Store, 
  Loader2,
  Save,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface Discount {
  _id: string
  type: 'delivery' | 'pickup'
  percentage: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function Discounts() {
  const { token } = useAuth()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  // Form values for each discount type
  const [deliveryPercentage, setDeliveryPercentage] = useState<number>(0)
  const [pickupPercentage, setPickupPercentage] = useState<number>(0)

  useEffect(() => {
    fetchDiscounts()
  }, [])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
  }

  const fetchDiscounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/discounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setDiscounts(data.discounts)
        // Set form values
        const delivery = data.discounts.find((d: Discount) => d.type === 'delivery')
        const pickup = data.discounts.find((d: Discount) => d.type === 'pickup')
        if (delivery) setDeliveryPercentage(delivery.percentage)
        if (pickup) setPickupPercentage(pickup.percentage)
      }
    } catch (error) {
      showNotification('error', 'Failed to load discounts')
    } finally {
      setLoading(false)
    }
  }

  const updateDiscount = async (type: 'delivery' | 'pickup', percentage: number) => {
    setSaving(type)
    try {
      const response = await fetch(`${API_BASE_URL}/discounts/${type}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ percentage }),
      })
      const data = await response.json()
      if (data.success) {
        setDiscounts(prev => prev.map(d => d.type === type ? data.discount : d))
        showNotification('success', `${type === 'delivery' ? 'Delivery' : 'Pickup'} discount updated`)
      } else {
        showNotification('error', data.message || 'Failed to update discount')
      }
    } catch (error) {
      showNotification('error', 'Failed to update discount')
    } finally {
      setSaving(null)
    }
  }

  const toggleDiscount = async (id: string) => {
    setSaving(id)
    try {
      const response = await fetch(`${API_BASE_URL}/discounts/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setDiscounts(prev => prev.map(d => d._id === id ? data.discount : d))
        showNotification('success', data.message)
      } else {
        showNotification('error', data.message || 'Failed to toggle discount')
      }
    } catch (error) {
      showNotification('error', 'Failed to toggle discount')
    } finally {
      setSaving(null)
    }
  }

  const getDiscount = (type: 'delivery' | 'pickup') => {
    return discounts.find(d => d.type === type)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  const deliveryDiscount = getDiscount('delivery')
  const pickupDiscount = getDiscount('pickup')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discounts</h1>
          <p className="text-gray-500 mt-1">Manage delivery and pickup discounts for orders</p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Discount Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Delivery Discount */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delivery Discount</h3>
                <p className="text-sm text-gray-500">Applied to all delivery orders</p>
              </div>
            </div>
            <button
              onClick={() => deliveryDiscount && toggleDiscount(deliveryDiscount._id)}
              disabled={saving === deliveryDiscount?._id}
              className="flex items-center gap-2"
            >
              {saving === deliveryDiscount?._id ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : deliveryDiscount?.isActive ? (
                <ToggleRight className="w-10 h-10 text-green-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Percentage
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={deliveryPercentage}
                  onChange={(e) => setDeliveryPercentage(Number(e.target.value))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="text-gray-500">%</span>
                <button
                  onClick={() => updateDiscount('delivery', deliveryPercentage)}
                  disabled={saving === 'delivery'}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving === 'delivery' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${deliveryDiscount?.isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <Tag className={`w-4 h-4 ${deliveryDiscount?.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${deliveryDiscount?.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                  Status: {deliveryDiscount?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {deliveryDiscount?.isActive && deliveryDiscount.percentage > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Customers get {deliveryDiscount.percentage}% off on delivery orders
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pickup Discount */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pickup Discount</h3>
                <p className="text-sm text-gray-500">Applied to all pickup orders</p>
              </div>
            </div>
            <button
              onClick={() => pickupDiscount && toggleDiscount(pickupDiscount._id)}
              disabled={saving === pickupDiscount?._id}
              className="flex items-center gap-2"
            >
              {saving === pickupDiscount?._id ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : pickupDiscount?.isActive ? (
                <ToggleRight className="w-10 h-10 text-green-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Percentage
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pickupPercentage}
                  onChange={(e) => setPickupPercentage(Number(e.target.value))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="text-gray-500">%</span>
                <button
                  onClick={() => updateDiscount('pickup', pickupPercentage)}
                  disabled={saving === 'pickup'}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving === 'pickup' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${pickupDiscount?.isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <Tag className={`w-4 h-4 ${pickupDiscount?.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${pickupDiscount?.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                  Status: {pickupDiscount?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {pickupDiscount?.isActive && pickupDiscount.percentage > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Customers get {pickupDiscount.percentage}% off on pickup orders
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">How Discounts Work</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Discounts are automatically applied at checkout based on order type</li>
          <li>• Set percentage to 0 to disable the discount without deactivating it</li>
          <li>• Toggle the switch to quickly enable/disable a discount</li>
          <li>• Both delivery and pickup discounts can be active at the same time</li>
        </ul>
      </div>
    </div>
  )
}
