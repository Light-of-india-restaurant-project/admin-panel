import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import FormModal from '@/components/FormModal'
import { useDebounce } from '@/hooks/useDebounce'
import { 
  useGetTables, 
  useCreateTable, 
  useUpdateTable, 
  useDeleteTable 
} from '@/hooks/useReservations'
import type { Table, TableFormData } from '@/types/reservation'

const PAGE_SIZE_OPTIONS = [5, 7, 10, 25, 50]

export default function Tables() {
  // Pagination & Filter states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [filterStatus, setFilterStatus] = useState('')
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<TableFormData>({
    name: '',
    capacity: 2,
    description: '',
    isActive: true,
  })

  // Query params
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filterStatus && { isActive: filterStatus === 'true' }),
  }), [page, pageSize, debouncedSearch, filterStatus])

  // React Query hooks
  const { data, isLoading } = useGetTables(queryParams)
  const createMutation = useCreateTable()
  const updateMutation = useUpdateTable()
  const deleteMutation = useDeleteTable()

  const tables = data?.data || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
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
    setEditingTable(null)
    setFormData({
      name: '',
      capacity: 2,
      description: '',
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (table: Table) => {
    setEditingTable(table)
    setFormData({
      name: table.name,
      capacity: table.capacity,
      description: table.description || '',
      isActive: table.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
      description: formData.description || undefined,
    }
    
    try {
      if (editingTable) {
        await updateMutation.mutateAsync({ id: editingTable._id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setIsModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save table')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete table')
      setDeleteConfirm(null)
    }
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tables</h1>
          <p className="text-sm text-gray-500 mt-1">Manage restaurant tables for reservations</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Table
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-900 font-medium">Dismiss</button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading tables...</div>
        ) : tables.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tables found. Create your first table to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tables.map((table) => (
                  <tr key={table._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-900">{table.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <Users className="w-4 h-4" />
                        {table.capacity} {table.capacity === 1 ? 'seat' : 'seats'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 max-w-xs truncate">
                      {table.description || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        table.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {table.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(table)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(table._id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>of {pagination.total} tables</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? 'Edit Table' : 'Create Table'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Table 1, Window Seat A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (seats) *
            </label>
            <input
              type="number"
              required
              min={1}
              max={20}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum guests that can sit at this table (1-20)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Near the window, Quiet corner"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active (available for reservations)
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isFormLoading ? 'Saving...' : editingTable ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <FormModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Table"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this table? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  )
}
