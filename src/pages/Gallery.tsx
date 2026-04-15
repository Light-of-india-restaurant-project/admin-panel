import { useState, useMemo, useRef } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Upload } from 'lucide-react'
import FormModal from '@/components/FormModal'
import {
  useGetGalleryImages,
  useCreateGalleryImage,
  useUpdateGalleryImage,
  useDeleteGalleryImage,
  useSetFeaturedImage,
} from '@/hooks/useGallery'
import type { GalleryImage, GalleryFormData } from '@/hooks/useGallery'

export default function Gallery() {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<1 | 2>(1)
  
  // Form states
  const [formData, setFormData] = useState<GalleryFormData>({
    title: '',
    titleNl: '',
    alt: '',
    altNl: '',
    category: 'food',
    imageUrl: '',
    section: 1,
    isFeatured: false,
    isActive: true,
  })

  // React Query hooks
  const { data, isLoading } = useGetGalleryImages()
  const createMutation = useCreateGalleryImage()
  const updateMutation = useUpdateGalleryImage()
  const deleteMutation = useDeleteGalleryImage()
  const setFeaturedMutation = useSetFeaturedImage()

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Handle file upload - convert to base64
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setFormData(prev => ({ ...prev, imageUrl: base64 }))
        setIsUploading(false)
      }
      reader.onerror = () => {
        setError('Failed to read file')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Failed to upload file')
      setIsUploading(false)
    }
    e.target.value = '' // Reset input
  }

  const images = data?.images || []

  // Separate images by section
  const section1Images = useMemo(() => 
    images.filter(img => img.section === 1).sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1
      if (!a.isFeatured && b.isFeatured) return 1
      return a.sortOrder - b.sortOrder
    }), [images])

  const section2Images = useMemo(() => 
    images.filter(img => img.section === 2).sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1
      if (!a.isFeatured && b.isFeatured) return 1
      return a.sortOrder - b.sortOrder
    }), [images])

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else if (name === 'section') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) as 1 | 2 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      titleNl: '',
      alt: '',
      altNl: '',
      category: 'food',
      imageUrl: '',
      section: selectedSection,
      isFeatured: false,
      isActive: true,
    })
    setEditingImage(null)
    setError(null)
  }

  // Open modal for new image in a section
  const handleAdd = (section: 1 | 2) => {
    setSelectedSection(section)
    resetForm()
    setFormData(prev => ({ ...prev, section }))
    setIsModalOpen(true)
  }

  // Open modal for editing
  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image)
    setFormData({
      title: image.title,
      titleNl: image.titleNl,
      alt: image.alt,
      altNl: image.altNl,
      category: image.category,
      imageUrl: image.imageUrl,
      section: image.section,
      isFeatured: image.isFeatured,
      sortOrder: image.sortOrder,
      isActive: image.isActive,
    })
    setIsModalOpen(true)
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate image
    if (!formData.imageUrl) {
      setError('Please upload an image or enter an image URL')
      return
    }

    try {
      if (editingImage) {
        await updateMutation.mutateAsync({ id: editingImage._id, data: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      setIsModalOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  // Handle toggle active
  const handleToggleActive = async (image: GalleryImage) => {
    try {
      await updateMutation.mutateAsync({ 
        id: image._id, 
        data: { isActive: !image.isActive } 
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  // Handle set featured
  const handleSetFeatured = async (image: GalleryImage) => {
    try {
      await setFeaturedMutation.mutateAsync({ id: image._id, section: image.section })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set featured')
    }
  }

  // Render a section
  const renderSection = (sectionNum: 1 | 2, sectionImages: GalleryImage[]) => {
    const featuredImage = sectionImages.find(img => img.isFeatured)
    const smallImages = sectionImages.filter(img => !img.isFeatured)
    const sideImages = smallImages.slice(0, 2) // Two images stacked on the right
    const bottomImages = smallImages.slice(2, 5) // First bottom row (3 images)
    const extraRowImages = sectionNum === 2 ? smallImages.slice(5, 8) : [] // Extra row for section 2

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Section {sectionNum}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({sectionImages.length} images)
            </span>
          </h2>
          <button
            onClick={() => handleAdd(sectionNum)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Image
          </button>
        </div>

        {/* Layout Preview */}
        <div className="space-y-3">
          {/* Top Row: Large + 2 Side Images stacked */}
          <div className="flex gap-3">
            {/* Featured (Large) Image - 2/3 width */}
            <div className="w-2/3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Featured (Large)</p>
              {featuredImage ? (
                <div className={`relative group rounded-lg overflow-hidden ${!featuredImage.isActive ? 'opacity-50' : ''}`}>
                  <img
                    src={featuredImage.imageUrl}
                    alt={featuredImage.alt}
                    className="w-full h-[450px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Error'
                    }}
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Featured
                    </span>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      featuredImage.category === 'food' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {featuredImage.category}
                    </span>
                  </div>
                  {!featuredImage.isActive && (
                    <span className="absolute top-2 right-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      Inactive
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(featuredImage)} className="p-2 bg-white rounded-full hover:bg-gray-100" title="Edit">
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button onClick={() => handleToggleActive(featuredImage)} className="p-2 bg-white rounded-full hover:bg-gray-100" title={featuredImage.isActive ? 'Hide' : 'Show'}>
                      {featuredImage.isActive ? <EyeOff className="w-4 h-4 text-gray-700" /> : <Eye className="w-4 h-4 text-gray-700" />}
                    </button>
                    <button onClick={() => setDeleteConfirm(featuredImage._id)} className="p-2 bg-white rounded-full hover:bg-gray-100" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white text-sm font-medium">{featuredImage.title}</p>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => handleAdd(sectionNum)}
                  className="w-full h-[450px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50"
                >
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Add Featured Image</p>
                  </div>
                </div>
              )}
            </div>

            {/* Side Images - 1/3 width, stacked vertically */}
            <div className="w-1/3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Side ({sideImages.length}/2)</p>
              <div className="flex flex-col gap-3 h-[450px]">
                {sideImages.map((image) => (
                  <div key={image._id} className={`relative group rounded-lg overflow-hidden flex-1 ${!image.isActive ? 'opacity-50' : ''}`}>
                    <img
                      src={image.imageUrl}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'
                      }}
                    />
                    <span className={`absolute top-1 left-1 px-1 py-0.5 text-[10px] rounded font-medium ${
                      image.category === 'food' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {image.category}
                    </span>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button onClick={() => handleSetFeatured(image)} className="p-1 bg-white rounded-full hover:bg-amber-100" title="Set as Featured">
                        <Star className="w-3 h-3 text-amber-600" />
                      </button>
                      <button onClick={() => handleEdit(image)} className="p-1 bg-white rounded-full hover:bg-gray-100" title="Edit">
                        <Pencil className="w-3 h-3 text-gray-700" />
                      </button>
                      <button onClick={() => setDeleteConfirm(image._id)} className="p-1 bg-white rounded-full hover:bg-gray-100" title="Delete">
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Add placeholder if less than 2 side images */}
                {sideImages.length < 2 && (
                  <div
                    onClick={() => handleAdd(sectionNum)}
                    className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: 2 images under large (2/3) + 1 image under side (1/3) */}
          <div className="flex gap-3">
            {/* First 2 images - align with large image (2/3 width) */}
            <div className="w-2/3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Bottom (2 images)</p>
              <div className="grid grid-cols-2 gap-3">
                {bottomImages.slice(0, 2).map((image) => (
                  <div
                    key={image._id}
                    className={`relative group rounded-lg overflow-hidden ${!image.isActive ? 'opacity-50' : ''}`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.alt}
                      className="w-full h-[180px] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'
                      }}
                    />
                    <span className={`absolute top-1 left-1 px-1 py-0.5 text-[10px] rounded font-medium ${
                      image.category === 'food' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {image.category}
                    </span>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button onClick={() => handleSetFeatured(image)} className="p-1 bg-white rounded-full hover:bg-amber-100" title="Set as Featured">
                        <Star className="w-3 h-3 text-amber-600" />
                      </button>
                      <button onClick={() => handleEdit(image)} className="p-1 bg-white rounded-full hover:bg-gray-100" title="Edit">
                        <Pencil className="w-3 h-3 text-gray-700" />
                      </button>
                      <button onClick={() => setDeleteConfirm(image._id)} className="p-1 bg-white rounded-full hover:bg-gray-100" title="Delete">
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Add placeholder if less than 2 */}
                {bottomImages.length < 2 && (
                  <div
                    onClick={() => handleAdd(sectionNum)}
                    className="h-[180px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* 3rd image - align with side images (1/3 width) */}
            <div className="w-1/3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Bottom (1 image)</p>
              {bottomImages[2] ? (
                <div className={`relative group rounded-lg overflow-hidden ${!bottomImages[2].isActive ? 'opacity-50' : ''}`}>
                  <img
                    src={bottomImages[2].imageUrl}
                    alt={bottomImages[2].alt}
                    className="w-full h-[180px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'
                    }}
                  />
                  <span className={`absolute top-1 left-1 px-1 py-0.5 text-[10px] rounded font-medium ${
                    bottomImages[2].category === 'food' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {bottomImages[2].category}
                  </span>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button onClick={() => handleSetFeatured(bottomImages[2])} className="p-1 bg-white rounded-full hover:bg-amber-100" title="Set as Featured">
                      <Star className="w-3 h-3 text-amber-600" />
                    </button>
                    <button onClick={() => handleEdit(bottomImages[2])} className="p-1 bg-white rounded-full hover:bg-gray-100" title="Edit">
                      <Pencil className="w-3 h-3 text-gray-700" />
                    </button>
                    <button onClick={() => setDeleteConfirm(bottomImages[2]._id)} className="p-1 bg-white rounded-full hover:bg-gray-100" title="Delete">
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => handleAdd(sectionNum)}
                  className="h-[180px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Extra Bottom Row for Section 2 - 3 more images */}
          {sectionNum === 2 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Extra Row (Section 2 only - 3 images)</p>
              <div className="grid grid-cols-3 gap-3">
                {extraRowImages.map((image) => (
                  <div
                    key={image._id}
                    className={`relative group rounded-lg overflow-hidden ${!image.isActive ? 'opacity-50' : ''}`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.alt}
                      className="w-full h-[180px] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'
                      }}
                    />
                    <span className={`absolute top-1 left-1 px-1 py-0.5 text-[10px] rounded font-medium ${
                      image.category === 'food' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {image.category}
                    </span>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button onClick={() => handleSetFeatured(image)} className="p-1 bg-white rounded-full hover:bg-amber-100" title="Set as Featured">
                        <Star className="w-3 h-3 text-amber-600" />
                      </button>
                      <button onClick={() => handleEdit(image)} className="p-1 bg-white rounded-full hover:bg-gray-100" title="Edit">
                        <Pencil className="w-3 h-3 text-gray-700" />
                      </button>
                      <button onClick={() => setDeleteConfirm(image._id)} className="p-1 bg-white rounded-full hover:bg-gray-100" title="Delete">
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Add placeholders for missing images */}
                {extraRowImages.length < 3 && Array.from({ length: 3 - extraRowImages.length }).map((_, i) => (
                  <div
                    key={`placeholder-extra-${i}`}
                    onClick={() => handleAdd(sectionNum)}
                    className="h-[180px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Two sections, each with one large featured image and multiple small images.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {renderSection(1, section1Images)}
          {renderSection(2, section2Images)}
        </div>
      )}

      {/* Add/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingImage ? 'Edit Gallery Image' : 'Add Gallery Image'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (English) *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Butter Chicken"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (Dutch) *</label>
              <input
                type="text"
                name="titleNl"
                value={formData.titleNl}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Boter Kip"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (English) *</label>
              <input
                type="text"
                name="alt"
                value={formData.alt}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Creamy butter chicken"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (Dutch) *</label>
              <input
                type="text"
                name="altNl"
                value={formData.altNl}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Romige boter kip"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
            
            {/* File Upload Button - More Prominent */}
            <div className="mb-3 p-4 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50/50">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 mx-auto text-sm font-medium"
                >
                  <Upload className="w-5 h-5" />
                  {isUploading ? 'Uploading...' : 'Choose Image from Device'}
                </button>
                <p className="text-xs text-gray-500 mt-2">Max 5MB. Supports JPG, PNG, WebP</p>
              </div>
            </div>

            {/* OR divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">OR enter URL</span>
              </div>
            </div>

            {/* URL Input */}
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com/image.jpg"
            />
            
            {/* Preview - Shows both URL and uploaded images */}
            {formData.imageUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="relative inline-block">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/160x160?text=Invalid+Image'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {formData.imageUrl.startsWith('data:') && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded font-medium">
                      Uploaded
                    </span>
                  )}
                  {!formData.imageUrl.startsWith('data:') && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded font-medium">
                      URL
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="food">Food</option>
                <option value="ambiance">Ambiance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>Section 1</option>
                <option value={2}>Section 2</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Featured (Large image)</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active (Visible on website)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingImage ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Image</h3>
            <p className="text-gray-600 mb-4">Are you sure? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
