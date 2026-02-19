import { useState, useMemo, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Building2, TreeDeciduous, Home, CheckCircle, XCircle } from 'lucide-react'
import FormModal from '@/components/FormModal'
import { useDebounce } from '@/hooks/useDebounce'
import { 
  useGetFloors, 
  useCreateFloor, 
  useUpdateFloor, 
  useDeleteFloor 
} from '@/hooks/useReservations'
import type { Floor, FloorFormData, LocationType } from '@/types/reservation'

const PAGE_SIZE_OPTIONS = [5, 7, 10, 25, 50]

const LOCATION_TYPES: { value: LocationType; label: string; icon: typeof Building2 }[] = [
  { value: 'inside', label: 'Inside', icon: Home },
  { value: 'outside', label: 'Outside', icon: TreeDeciduous },
  { value: 'terrace', label: 'Terrace', icon: Building2 },
]

// Toast notification type
interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function Floors() {
  // Pagination & Filter states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(7)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterLocationType, setFilterLocationType] = useState<string>('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  // Toast notification state
  const [toast, setToast] = useState<Toast | null>(null)
  
  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])
  
  // Form states
  const [formData, setFormData] = useState<FloorFormData>({
    name: '',
    floorNumber: 1,
    locationType: 'inside',
    description: '',
    isActive: true,
  })

  // Query params
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filterStatus && { isActive: filterStatus }),
    ...(filterLocationType && { locationType: filterLocationType }),
  }), [page, pageSize, debouncedSearch, filterStatus, filterLocationType])

  // React Query hooks
  const { data, isLoading } = useGetFloors(queryParams)
  const createMutation = useCreateFloor()
  const updateMutation = useUpdateFloor()
  const deleteMutation = useDeleteFloor()

  const floors = data?.data || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 7, totalPages: 1 }

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleFilterChange = (value: string) => {
    setFilterStatus(value)
    setPage(1)
  }

  const handleLocationFilterChange = (value: string) => {
    setFilterLocationType(value)
    setPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage)
    }
  }

  const openCreateModal = () => {
    setEditingFloor(null)
    setFormData({ 
      name: '', 
      floorNumber: floors.length > 0 ? Math.max(...floors.map(f => f.floorNumber)) + 1 : 1, 
      locationType: 'inside', 
      description: '', 
      isActive: true 
    })
    setIsModalOpen(true)
  }

  const openEditModal = (floor: Floor) => {
    setEditingFloor(floor)
    setFormData({
      name: floor.name,
      floorNumber: floor.floorNumber,
      locationType: floor.locationType,
      description: floor.description || '',
      isActive: floor.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingFloor) {
        await updateMutation.mutateAsync({ id: editingFloor._id, data: formData })
        setToast({ type: 'success', message: 'Floor updated successfully' })
      } else {
        await createMutation.mutateAsync(formData)
        setToast({ type: 'success', message: 'Floor created successfully' })
      }
      setIsModalOpen(false)
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save floor' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
      setToast({ type: 'success', message: 'Floor deleted successfully' })
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete floor' })
      setDeleteConfirm(null)
    }
  }

  const getLocationIcon = (type: LocationType) => {
    const found = LOCATION_TYPES.find(t => t.value === type)
    if (!found) return <Building2 className="h-4 w-4" />
    const Icon = found.icon
    return <Icon className="h-4 w-4" />
  }

  const getLocationLabel = (type: LocationType) => {
    return LOCATION_TYPES.find(t => t.value === type)?.label || type
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Floors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage restaurant floors - Inside, Outside, Terrace areas</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Floor
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search floors..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={filterLocationType}
            onChange={(e) => handleLocationFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Locations</option>
            {LOCATION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Floors Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {floors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {debouncedSearch || filterStatus || filterLocationType
                        ? 'No floors match your search criteria.' 
                        : 'No floors found. Create your first floor to get started.'}
                    </td>
                  </tr>
                ) : (
                  floors.map((floor) => (
                    <tr key={floor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-medium">
                          {floor.floorNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{floor.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          floor.locationType === 'inside' 
                            ? 'bg-blue-100 text-blue-800' 
                            : floor.locationType === 'outside'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {getLocationIcon(floor.locationType)}
                          {getLocationLabel(floor.locationType)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 line-clamp-1">{floor.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          floor.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {floor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openEditModal(floor)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(floor._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} floors
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            pagination.page === pageNum
                              ? 'bg-indigo-600 text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFloor ? 'Edit Floor' : 'Create Floor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Ground Floor, First Floor, Rooftop"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor Number *
            </label>
            <input
              type="number"
              value={formData.floorNumber}
              onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="0"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Use 0 for ground floor, 1 for first floor, etc.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Type *
            </label>
            <select
              value={formData.locationType}
              onChange={(e) => setFormData({ ...formData, locationType: e.target.value as LocationType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              {LOCATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Optional description for this floor"
              rows={3}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active (available for reservations)
            </label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isFormLoading ? 'Saving...' : (editingFloor ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <FormModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Floor"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this floor? This action cannot be undone.
        </p>
        <p className="text-sm text-red-600 mb-4">
          Note: Floors with rows or tables cannot be deleted. Remove the rows and tables first.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            disabled={deleteMutation.isPending}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </FormModal>
    </div>
  )
}
