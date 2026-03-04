import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Filter, Image, X } from 'lucide-react'
import FormModal from '@/components/FormModal'
import { useDebounce } from '@/hooks/useDebounce'
import { 
  useGetCateringPacks, 
  useCreateCateringPack, 
  useUpdateCateringPack, 
  useDeleteCateringPack 
} from '@/hooks/useCatering'
import { useGetAllItems } from '@/hooks/useMenu'
import type { CateringPack, CateringPackFormData, CateringCategory, MenuItem } from '@/types/catering'

const PAGE_SIZE_OPTIONS = [5, 7, 10, 25, 50]

const CATEGORY_OPTIONS: { value: CateringCategory; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non-vegetarian', label: 'Non-Vegetarian' },
  { value: 'mixed', label: 'Mixed' },
]

export default function CateringPacks() {
  // Pagination & Filter states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(7)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [filterCategory, setFilterCategory] = useState<CateringCategory | ''>('')
  const [filterStatus, setFilterStatus] = useState<'true' | 'false' | ''>('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPack, setEditingPack] = useState<CateringPack | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<CateringPackFormData>({
    name: '',
    description: '',
    descriptionNl: '',
    category: 'vegetarian',
    pricePerPerson: 0,
    minPeople: 10,
    menuItems: [],
    image: '',
    isActive: true,
    sortOrder: 0,
  })

  // Menu items search for selection
  const [menuItemSearch, setMenuItemSearch] = useState('')
  const debouncedMenuSearch = useDebounce(menuItemSearch, 200)

  // Query params
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filterCategory && { category: filterCategory }),
    ...(filterStatus && { isActive: filterStatus === 'true' }),
  }), [page, pageSize, debouncedSearch, filterCategory, filterStatus])

  // React Query hooks
  const { data, isLoading } = useGetCateringPacks(queryParams)
  const { data: menuItemsData } = useGetAllItems()
  const createMutation = useCreateCateringPack()
  const updateMutation = useUpdateCateringPack()
  const deleteMutation = useDeleteCateringPack()

  const packs = data?.packs || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 7, totalPages: 1 }
  const allMenuItems: MenuItem[] = (menuItemsData?.items || []).filter((item: any) => item.isActive)

  // Filter menu items for selection
  const filteredMenuItems = allMenuItems.filter(item => 
    item.name.toLowerCase().includes(debouncedMenuSearch.toLowerCase())
  )

  // Filter helpers
  const activeFilterCount = [filterCategory, filterStatus].filter(Boolean).length

  const clearFilters = () => {
    setFilterCategory('')
    setFilterStatus('')
    setSearchQuery('')
    setPage(1)
  }

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
    setEditingPack(null)
    setFormData({
      name: '',
      description: '',
      descriptionNl: '',
      category: 'vegetarian',
      pricePerPerson: 0,
      minPeople: 10,
      menuItems: [],
      image: '',
      isActive: true,
      sortOrder: 0,
    })
    setMenuItemSearch('')
    setIsModalOpen(true)
  }

  const openEditModal = (pack: CateringPack) => {
    setEditingPack(pack)
    setFormData({
      name: pack.name,
      description: pack.description,
      descriptionNl: pack.descriptionNl,
      category: pack.category,
      pricePerPerson: pack.pricePerPerson,
      minPeople: pack.minPeople,
      menuItems: pack.menuItems.map(item => item._id),
      image: pack.image || '',
      isActive: pack.isActive,
      sortOrder: pack.sortOrder,
    })
    setMenuItemSearch('')
    setIsModalOpen(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleMenuItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      menuItems: prev.menuItems.includes(itemId)
        ? prev.menuItems.filter(id => id !== itemId)
        : [...prev.menuItems, itemId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.menuItems.length === 0) {
      setError('Please select at least one menu item')
      return
    }
    
    const payload = {
      ...formData,
      pricePerPerson: Number(formData.pricePerPerson),
      minPeople: Number(formData.minPeople),
      image: formData.image || undefined,
    }
    
    try {
      if (editingPack) {
        await updateMutation.mutateAsync({ id: editingPack._id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setIsModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pack')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pack')
      setDeleteConfirm(null)
    }
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  const getCategoryBadgeColor = (category: CateringCategory) => {
    switch (category) {
      case 'vegetarian': return 'bg-green-100 text-green-800'
      case 'non-vegetarian': return 'bg-red-100 text-red-800'
      case 'mixed': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: CateringCategory) => {
    return CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category
  }

  // Get menu item names for display
  const getSelectedMenuItemNames = () => {
    return formData.menuItems
      .map(id => allMenuItems.find(item => item._id === id)?.name)
      .filter(Boolean)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Catering Packs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your catering packages with menu items</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={allMenuItems.length === 0}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-5 w-5" />
          Add Pack
        </button>
      </div>

      {allMenuItems.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
          Please create active menu items before creating catering packs.
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-900 font-medium">Dismiss</button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search packs..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-5 w-5" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value as CateringCategory | ''); setPage(1) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value as 'true' | 'false' | ''); setPage(1) }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pack</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price/Person</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Min People</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : packs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No catering packs found</td>
                </tr>
              ) : (
                packs.map((pack) => (
                  <tr key={pack._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {pack.image ? (
                          <img src={pack.image} alt={pack.name} className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Image className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{pack.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{pack.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(pack.category)}`}>
                        {getCategoryLabel(pack.category)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-900 font-medium">€{pack.pricePerPerson.toFixed(2)}</td>
                    <td className="px-4 py-4 text-gray-600">{pack.minPeople}</td>
                    <td className="px-4 py-4 text-gray-600">{pack.menuItems.length} items</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pack.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pack.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(pack)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(pack._id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>of {pagination.total} packs</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPack ? 'Edit Catering Pack' : 'Create Catering Pack'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pack Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (English) *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Dutch) *</label>
            <textarea
              value={formData.descriptionNl}
              onChange={(e) => setFormData(prev => ({ ...prev, descriptionNl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
              required
            />
          </div>

          {/* Category & Price Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CateringCategory }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Person (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerPerson}
                onChange={(e) => setFormData(prev => ({ ...prev, pricePerPerson: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Min People & Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum People *</label>
              <input
                type="number"
                min="1"
                value={formData.minPeople}
                onChange={(e) => setFormData(prev => ({ ...prev, minPeople: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Menu Items Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Menu Items * ({formData.menuItems.length} selected)
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Search input */}
              <div className="p-2 border-b border-gray-200 bg-gray-50">
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={menuItemSearch}
                  onChange={(e) => setMenuItemSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {/* Selected items */}
              {formData.menuItems.length > 0 && (
                <div className="p-2 border-b border-gray-200 bg-indigo-50">
                  <div className="flex flex-wrap gap-2">
                    {getSelectedMenuItemNames().map((name, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                        {name}
                        <button
                          type="button"
                          onClick={() => {
                            const item = allMenuItems.find(i => i.name === name)
                            if (item) toggleMenuItem(item._id)
                          }}
                          className="hover:text-indigo-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Items list */}
              <div className="max-h-48 overflow-y-auto">
                {filteredMenuItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No menu items found</div>
                ) : (
                  filteredMenuItems.map(item => (
                    <label
                      key={item._id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                        formData.menuItems.includes(item._id) ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.menuItems.includes(item._id)}
                        onChange={() => toggleMenuItem(item._id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">€{item.price.toFixed(2)}</div>
                      </div>
                      {item.isVegetarian && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">Veg</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <div className="flex items-center gap-4">
              {formData.image ? (
                <div className="relative">
                  <img src={formData.image} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Image className="h-8 w-8 text-gray-400" />
                </label>
              )}
              <span className="text-sm text-gray-500">Click to upload an image</span>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isFormLoading ? 'Saving...' : editingPack ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <FormModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Catering Pack"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to delete this catering pack? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  )
}
