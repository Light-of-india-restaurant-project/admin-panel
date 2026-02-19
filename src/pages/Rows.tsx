import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, LayoutList } from 'lucide-react'
import FormModal from '@/components/FormModal'
import { useDebounce } from '@/hooks/useDebounce'
import { 
  useGetRows, 
  useCreateRow, 
  useUpdateRow, 
  useDeleteRow,
  useGetFloors 
} from '@/hooks/useReservations'
import type { Row, RowFormData } from '@/types/reservation'

const PAGE_SIZE_OPTIONS = [5, 7, 10, 25, 50]

export default function Rows() {
  // Pagination & Filter states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(7)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterFloor, setFilterFloor] = useState<string>('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<Row | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<RowFormData>({
    name: '',
    rowNumber: 1,
    floor: '',
    description: '',
    isActive: true,
  })

  // Query params
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filterStatus && { isActive: filterStatus }),
    ...(filterFloor && { floor: filterFloor }),
  }), [page, pageSize, debouncedSearch, filterStatus, filterFloor])

  // React Query hooks
  const { data, isLoading } = useGetRows(queryParams)
  const { data: floorsData } = useGetFloors({ limit: 100 })
  const createMutation = useCreateRow()
  const updateMutation = useUpdateRow()
  const deleteMutation = useDeleteRow()

  const rows = data?.data || []
  const floors = floorsData?.data || []
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

  const handleFloorFilterChange = (value: string) => {
    setFilterFloor(value)
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
    setEditingRow(null)
    const defaultFloor = floors.length > 0 ? floors[0]._id : ''
    setFormData({ 
      name: '', 
      rowNumber: 1, 
      floor: defaultFloor, 
      description: '', 
      isActive: true 
    })
    setIsModalOpen(true)
  }

  const openEditModal = (row: Row) => {
    setEditingRow(row)
    setFormData({
      name: row.name,
      rowNumber: row.rowNumber,
      floor: typeof row.floor === 'string' ? row.floor : row.floor._id,
      description: row.description || '',
      isActive: row.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.floor) {
      setError('Please select a floor')
      return
    }
    
    try {
      if (editingRow) {
        await updateMutation.mutateAsync({ id: editingRow._id, data: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      setIsModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save row')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete row')
      setDeleteConfirm(null)
    }
  }

  const getFloorName = (floor: Row['floor']) => {
    if (typeof floor === 'string') {
      const found = floors.find(f => f._id === floor)
      return found?.name || 'Unknown'
    }
    return floor.name
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rows</h1>
          <p className="text-sm text-gray-500 mt-1">Manage table rows within each floor - First Row, Second Row, etc.</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={floors.length === 0}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-5 w-5" />
          Add Row
        </button>
      </div>

      {floors.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
          Please create at least one floor before adding rows.
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-900 font-medium">Dismiss</button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search rows..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={filterFloor}
            onChange={(e) => handleFloorFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Floors</option>
            {floors.map((floor) => (
              <option key={floor._id} value={floor._id}>{floor.name}</option>
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

      {/* Rows Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {debouncedSearch || filterStatus || filterFloor
                        ? 'No rows match your search criteria.' 
                        : 'No rows found. Create your first row to get started.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                          <LayoutList className="h-3.5 w-3.5" />
                          {row.rowNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{row.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{getFloorName(row.floor)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 line-clamp-1">{row.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openEditModal(row)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(row._id)}
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
                  Showing {pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} rows
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
        title={editingRow ? 'Edit Row' : 'Create Row'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Row Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., First Row, Window Row, Corner Row"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Row Number *
            </label>
            <input
              type="number"
              value={formData.rowNumber}
              onChange={(e) => setFormData({ ...formData, rowNumber: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor *
            </label>
            <select
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select a floor</option>
              {floors.map((floor) => (
                <option key={floor._id} value={floor._id}>{floor.name}</option>
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
              placeholder="Optional description for this row"
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
              Active (available for table placement)
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
              {isFormLoading ? 'Saving...' : (editingRow ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <FormModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Row"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this row? This action cannot be undone.
        </p>
        <p className="text-sm text-red-600 mb-4">
          Note: Rows with tables cannot be deleted. Remove the tables first.
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
