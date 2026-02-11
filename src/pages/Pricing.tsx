import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  CreditCard, 
  Package, 
  Save, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Check,
  Loader2,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'

interface SubscriptionPricing {
  oneMonth: { price: number; enabled: boolean }
  threeMonths: { price: number; enabled: boolean }
  sixMonths: { price: number; enabled: boolean }
  twelveMonths: { price: number; enabled: boolean }
}

interface Subscription {
  id: string
  code: string
  name: string
  description: string
  currency: string
  features: Record<string, boolean | string>
  isActive: boolean
  pricing: SubscriptionPricing
}

interface ConnectPack {
  id: string
  name: string
  description: string
  connects: number
  price: number
  currency: string
  isPopular: boolean
  savings: string | null
  sortOrder: number
  isActive: boolean
}

interface PricingStats {
  subscriptions: { active: number; total: number }
  connects: { totalSold: number; totalPurchases: number; totalRevenue: number }
  recentPurchases: Array<{
    id: string
    userEmail: string
    userName: string
    packName: string
    connects: number
    amount: number
    purchasedAt: string
  }>
}

export default function Pricing() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'connects'>('subscriptions')
  
  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [subSaving, setSubSaving] = useState(false)
  
  // Connect packs state
  const [packs, setPacks] = useState<ConnectPack[]>([])
  const [packsLoading, setPacksLoading] = useState(true)
  const [editingPack, setEditingPack] = useState<ConnectPack | null>(null)
  const [isCreatingPack, setIsCreatingPack] = useState(false)
  const [packSaving, setPackSaving] = useState(false)
  
  // Stats
  const [stats, setStats] = useState<PricingStats | null>(null)
  
  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchSubscription()
    fetchConnectPacks()
    fetchStats()
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

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/admin/pricing/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setSubLoading(false)
    }
  }

  const fetchConnectPacks = async () => {
    try {
      const response = await fetch('/api/admin/pricing/connect-packs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPacks(data.packs)
      }
    } catch (error) {
      console.error('Failed to fetch connect packs:', error)
    } finally {
      setPacksLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/pricing/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const saveSubscription = async () => {
    if (!subscription) return
    
    setSubSaving(true)
    try {
      const response = await fetch('/api/admin/pricing/subscription', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: subscription.name,
          description: subscription.description,
          features: subscription.features,
          isActive: subscription.isActive,
          pricing: subscription.pricing
        })
      })
      
      if (response.ok) {
        showNotification('success', 'Subscription settings saved!')
      } else {
        showNotification('error', 'Failed to save subscription settings')
      }
    } catch (error) {
      console.error('Error saving subscription:', error)
      showNotification('error', 'Failed to save subscription settings')
    } finally {
      setSubSaving(false)
    }
  }

  const savePack = async (pack: Partial<ConnectPack>) => {
    setPackSaving(true)
    try {
      const url = isCreatingPack 
        ? '/api/admin/pricing/connect-packs'
        : `/api/admin/pricing/connect-packs/${pack.id}`
      
      const response = await fetch(url, {
        method: isCreatingPack ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pack)
      })
      
      if (response.ok) {
        showNotification('success', isCreatingPack ? 'Pack created!' : 'Pack updated!')
        fetchConnectPacks()
        setEditingPack(null)
        setIsCreatingPack(false)
      } else {
        showNotification('error', 'Failed to save pack')
      }
    } catch (error) {
      console.error('Error saving pack:', error)
      showNotification('error', 'Failed to save pack')
    } finally {
      setPackSaving(false)
    }
  }

  const deletePack = async (packId: string) => {
    if (!confirm('Are you sure you want to delete this pack?')) return
    
    try {
      const response = await fetch(`/api/admin/pricing/connect-packs/${packId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        showNotification('success', 'Pack deleted!')
        fetchConnectPacks()
      } else {
        showNotification('error', 'Failed to delete pack')
      }
    } catch (error) {
      console.error('Error deleting pack:', error)
      showNotification('error', 'Failed to delete pack')
    }
  }

  const updateSubscriptionPrice = (duration: keyof SubscriptionPricing, field: 'price' | 'enabled', value: number | boolean) => {
    if (!subscription) return
    setSubscription({
      ...subscription,
      pricing: {
        ...subscription.pricing,
        [duration]: {
          ...subscription.pricing[duration],
          [field]: value
        }
      }
    })
  }

  return (
    <div className="p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <p className="text-gray-600">Manage subscription plans and connect packs</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold">{stats.subscriptions.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Connects Sold</p>
                <p className="text-2xl font-bold">{stats.connects.totalSold}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pack Purchases</p>
                <p className="text-2xl font-bold">{stats.connects.totalPurchases}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Connect Revenue</p>
                <p className="text-2xl font-bold">€{stats.connects.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'subscriptions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('connects')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'connects'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Connect Packs
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div>
              {subLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : subscription ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={subscription.name}
                        onChange={(e) => setSubscription({ ...subscription, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subscription.isActive}
                          onChange={(e) => setSubscription({ ...subscription, isActive: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                        <span className="text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={subscription.description}
                      onChange={(e) => setSubscription({ ...subscription, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Pricing Table */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Pricing by Duration</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-gray-500">
                            <th className="pb-3">Duration</th>
                            <th className="pb-3">Price (€)</th>
                            <th className="pb-3">Per Month</th>
                            <th className="pb-3">Enabled</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {[
                            { key: 'oneMonth' as const, label: '1 Month', months: 1 },
                            { key: 'threeMonths' as const, label: '3 Months', months: 3 },
                            { key: 'sixMonths' as const, label: '6 Months', months: 6 },
                            { key: 'twelveMonths' as const, label: '12 Months', months: 12 }
                          ].map(({ key, label, months }) => (
                            <tr key={key}>
                              <td className="py-3 font-medium">{label}</td>
                              <td className="py-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={subscription.pricing[key].price}
                                  onChange={(e) => updateSubscriptionPrice(key, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="py-3 text-gray-500">
                                €{(subscription.pricing[key].price / months).toFixed(2)}/mo
                              </td>
                              <td className="py-3">
                                <input
                                  type="checkbox"
                                  checked={subscription.pricing[key].enabled}
                                  onChange={(e) => updateSubscriptionPrice(key, 'enabled', e.target.checked)}
                                  className="h-4 w-4 text-indigo-600 rounded"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={saveSubscription}
                      disabled={subSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {subSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No subscription plan configured. Save to create one.
                </div>
              )}
            </div>
          )}

          {/* Connect Packs Tab */}
          {activeTab === 'connects' && (
            <div>
              {/* Add Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    setEditingPack({
                      id: '',
                      name: '',
                      description: '',
                      connects: 25,
                      price: 9.99,
                      currency: 'EUR',
                      isPopular: false,
                      savings: null,
                      sortOrder: packs.length,
                      isActive: true
                    })
                    setIsCreatingPack(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Pack
                </button>
              </div>

              {packsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : packs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No connect packs configured. Click "Add Pack" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 px-2">Name</th>
                        <th className="pb-3 px-2">Connects</th>
                        <th className="pb-3 px-2">Price</th>
                        <th className="pb-3 px-2">Per Connect</th>
                        <th className="pb-3 px-2">Popular</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {packs.map((pack) => (
                        <tr key={pack.id} className="hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{pack.name}</p>
                              {pack.savings && <p className="text-xs text-green-600">{pack.savings}</p>}
                            </div>
                          </td>
                          <td className="py-3 px-2">{pack.connects}</td>
                          <td className="py-3 px-2">€{pack.price.toFixed(2)}</td>
                          <td className="py-3 px-2 text-gray-500">
                            €{(pack.price / pack.connects).toFixed(2)}
                          </td>
                          <td className="py-3 px-2">
                            {pack.isPopular && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Popular</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              pack.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {pack.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingPack(pack)
                                  setIsCreatingPack(false)
                                }}
                                className="p-1 text-gray-500 hover:text-indigo-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deletePack(pack.id)}
                                className="p-1 text-gray-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Pack Modal */}
      {editingPack && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {isCreatingPack ? 'Add Connect Pack' : 'Edit Connect Pack'}
              </h3>
              <button
                onClick={() => {
                  setEditingPack(null)
                  setIsCreatingPack(false)
                }}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pack Name</label>
                <input
                  type="text"
                  value={editingPack.name}
                  onChange={(e) => setEditingPack({ ...editingPack, name: e.target.value })}
                  placeholder="e.g., Starter Pack"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingPack.description}
                  onChange={(e) => setEditingPack({ ...editingPack, description: e.target.value })}
                  placeholder="e.g., Perfect for getting started"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Connects</label>
                  <input
                    type="number"
                    min="1"
                    value={editingPack.connects}
                    onChange={(e) => setEditingPack({ ...editingPack, connects: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPack.price}
                    onChange={(e) => setEditingPack({ ...editingPack, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Savings Text (optional)</label>
                <input
                  type="text"
                  value={editingPack.savings || ''}
                  onChange={(e) => setEditingPack({ ...editingPack, savings: e.target.value || null })}
                  placeholder="e.g., Save 20%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPack.isPopular}
                    onChange={(e) => setEditingPack({ ...editingPack, isPopular: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Mark as Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPack.isActive}
                    onChange={(e) => setEditingPack({ ...editingPack, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setEditingPack(null)
                  setIsCreatingPack(false)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => savePack(editingPack)}
                disabled={packSaving || !editingPack.name || !editingPack.connects || !editingPack.price}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {packSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isCreatingPack ? 'Create Pack' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
