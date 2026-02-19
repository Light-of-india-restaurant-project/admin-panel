import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  MapPin,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { get, post, patch, deleteApi } from '../api/client'

interface DeliveryZone {
  _id: string
  name: string
  postalCode: string
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

interface DeliveryZonesResponse {
  success: boolean
  message: string
  zones: DeliveryZone[]
  total: number
}

interface FormData {
  name: string
  postalCode: string
  description: string
  isActive: boolean
}

const initialFormData: FormData = {
  name: '',
  postalCode: '',
  description: '',
  isActive: true,
}

export default function DeliveryZones() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchZones = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await get<DeliveryZonesResponse>({
        url: 'delivery-zones?includeInactive=true',
      })
      setZones(response.zones || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delivery zones')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchZones()
  }

  const filteredZones = zones.filter(zone => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      zone.name.toLowerCase().includes(searchLower) ||
      zone.postalCode.includes(search) ||
      zone.description?.toLowerCase().includes(searchLower)
    )
  })

  const openCreateModal = () => {
    setEditingZone(null)
    setFormData(initialFormData)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (zone: DeliveryZone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name,
      postalCode: zone.postalCode,
      description: zone.description || '',
      isActive: zone.isActive,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validate
    if (!formData.name.trim()) {
      setFormError('Zone name is required')
      return
    }
    
    if (!/^[0-9]{4}$/.test(formData.postalCode)) {
      setFormError('Postal code must be exactly 4 digits')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name.trim(),
        postalCode: formData.postalCode,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      }

      if (editingZone) {
        await patch({
          url: `delivery-zones/${editingZone._id}`,
          body: payload,
        })
      } else {
        await post({
          url: 'delivery-zones',
          body: payload,
        })
      }
      
      setIsModalOpen(false)
      fetchZones()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save delivery zone')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (zone: DeliveryZone) => {
    try {
      await patch({
        url: `delivery-zones/${zone._id}/toggle`,
      })
      fetchZones()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle zone status')
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      await deleteApi({
        url: `delivery-zones/${id}`,
      })
      setDeleteConfirm(null)
      fetchZones()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete delivery zone')
      setDeleteConfirm(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Zones</h1>
          <p className="text-gray-500 mt-1">Manage postal codes for delivery areas</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Zone
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-900 font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, postal code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Zones List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading delivery zones...</p>
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {search ? 'No delivery zones found matching your search' : 'No delivery zones configured'}
            </p>
            {!search && (
              <button
                onClick={openCreateModal}
                className="text-indigo-600 hover:underline font-medium"
              >
                Add your first delivery zone
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Postal Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredZones.map((zone) => (
                  <tr key={zone._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${zone.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <MapPin className={`h-5 w-5 ${zone.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <span className="font-medium text-gray-900">{zone.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                        {zone.postalCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 text-sm max-w-xs truncate block">
                        {zone.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(zone)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          zone.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {zone.isActive ? (
                          <>
                            <ToggleRight className="h-4 w-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(zone)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(zone._id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
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

        {/* Summary */}
        {!loading && filteredZones.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredZones.length} zone{filteredZones.length !== 1 ? 's' : ''} total
            </span>
            <span>
              {filteredZones.filter(z => z.isActive).length} active, {filteredZones.filter(z => !z.isActive).length} inactive
            </span>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
              </h2>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Rotterdam City Center"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code (4 digits) *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="3011"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 4-digit postal code prefix (e.g., 3011 for all addresses like 3011 AA, 3011 AB, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Core Rotterdam area including Centrum,  Kralingen"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Zone is active (customers can order delivery to this area)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                    {editingZone ? 'Update Zone' : 'Create Zone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Delivery Zone?</h3>
              <p className="text-gray-600 mb-4">
                This will permanently remove this delivery zone. Customers in this area won't be able to place orders.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
