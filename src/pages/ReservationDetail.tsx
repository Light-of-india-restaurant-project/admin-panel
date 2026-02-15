import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Edit,
} from 'lucide-react'
import FormModal from '@/components/FormModal'
import { 
  useGetReservation,
  useGetTables,
  useUpdateReservation,
  useConfirmReservation,
  useCancelReservation,
  useCompleteReservation,
  useNoShowReservation,
} from '@/hooks/useReservations'
import type { ReservationStatus, ReservationUpdateData } from '@/types/reservation'

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-green-800', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-800', bgColor: 'bg-red-100', icon: X },
  completed: { label: 'Completed', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: Check },
  'no-show': { label: 'No Show', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: AlertTriangle },
}

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Edit form data
  const [editFormData, setEditFormData] = useState<ReservationUpdateData>({})

  // React Query hooks
  const { data: reservationData, isLoading } = useGetReservation(id || '')
  const { data: tablesData } = useGetTables({ limit: 100 })
  const updateMutation = useUpdateReservation()
  const confirmMutation = useConfirmReservation()
  const cancelMutation = useCancelReservation()
  const completeMutation = useCompleteReservation()
  const noShowMutation = useNoShowReservation()

  const reservation = reservationData?.data
  const tables = tablesData?.data || []

  const isActionLoading = confirmMutation.isPending || cancelMutation.isPending || 
    completeMutation.isPending || noShowMutation.isPending

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getTableName = () => {
    if (!reservation) return 'Unknown'
    if (typeof reservation.tableId === 'object') return reservation.tableId.name
    const table = tables.find(t => t._id === reservation.tableId)
    return table?.name || 'Unknown'
  }

  const getTableCapacity = () => {
    if (!reservation) return 0
    if (typeof reservation.tableId === 'object') return reservation.tableId.capacity
    const table = tables.find(t => t._id === reservation.tableId)
    return table?.capacity || 0
  }

  const handleStatusAction = async (action: 'confirm' | 'cancel' | 'complete' | 'no-show') => {
    if (!id) return
    setError(null)
    try {
      switch (action) {
        case 'confirm':
          await confirmMutation.mutateAsync(id)
          break
        case 'cancel':
          await cancelMutation.mutateAsync(id)
          break
        case 'complete':
          await completeMutation.mutateAsync(id)
          break
        case 'no-show':
          await noShowMutation.mutateAsync(id)
          break
      }
      setShowStatusModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const openEditModal = () => {
    if (!reservation) return
    setEditFormData({
      adminNotes: reservation.adminNotes || '',
      tableId: typeof reservation.tableId === 'object' ? reservation.tableId._id : reservation.tableId,
    })
    setShowEditModal(true)
  }

  const handleUpdateReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError(null)
    
    try {
      await updateMutation.mutateAsync({ id, data: editFormData })
      setShowEditModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reservation')
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="bg-white rounded-xl p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700">Reservation not found</h2>
          <button
            onClick={() => navigate('/reservations')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Back to Reservations
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[reservation.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/reservations')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reservation Details</h1>
          <p className="text-sm text-gray-500">
            Confirmation Code: <code className="px-2 py-0.5 bg-gray-100 rounded font-mono">{reservation.confirmationCode}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openEditModal}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Change Status
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-900 font-medium">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Guest Information</h2>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</label>
              <p className="text-lg font-medium text-gray-900">{reservation.name}</p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Guests</label>
              <p className="text-lg text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                {reservation.guests} {reservation.guests === 1 ? 'person' : 'people'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${reservation.email}`} className="text-indigo-600 hover:underline">
                  {reservation.email}
                </a>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-400" />
                <a href={`tel:${reservation.phone}`} className="text-indigo-600 hover:underline">
                  {reservation.phone}
                </a>
              </p>
            </div>
          </div>

          {reservation.specialRequests && (
            <div className="mt-6 pt-6 border-t">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Special Requests</label>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{reservation.specialRequests}</p>
            </div>
          )}

          {reservation.adminNotes && (
            <div className="mt-6 pt-6 border-t">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Admin Notes</label>
              <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border border-yellow-100">{reservation.adminNotes}</p>
            </div>
          )}
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Date & Time Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Date & Time</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(reservation.date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">{reservation.time} - {reservation.endTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Table Assignment</h3>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{getTableName()}</p>
                <p className="text-sm text-gray-500">{getTableCapacity()} seats capacity</p>
              </div>
            </div>
          </div>

          {/* Timestamps Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Record Info</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {new Date(reservation.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-900">
                  {new Date(reservation.updatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Status Modal */}
      <FormModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Reservation Status"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Current status: <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </p>

          <div className="space-y-2">
            {reservation.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusAction('confirm')}
                  disabled={isActionLoading}
                  className="w-full flex items-center gap-3 p-3 border border-green-200 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Confirm Reservation</p>
                    <p className="text-xs text-green-600">Accept this reservation request</p>
                  </div>
                </button>
                <button
                  onClick={() => handleStatusAction('cancel')}
                  disabled={isActionLoading}
                  className="w-full flex items-center gap-3 p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Cancel Reservation</p>
                    <p className="text-xs text-red-600">Decline this reservation request</p>
                  </div>
                </button>
              </>
            )}

            {reservation.status === 'confirmed' && (
              <>
                <button
                  onClick={() => handleStatusAction('complete')}
                  disabled={isActionLoading}
                  className="w-full flex items-center gap-3 p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Mark as Completed</p>
                    <p className="text-xs text-blue-600">Guest has finished their visit</p>
                  </div>
                </button>
                <button
                  onClick={() => handleStatusAction('no-show')}
                  disabled={isActionLoading}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Mark as No Show</p>
                    <p className="text-xs text-gray-600">Guest did not arrive</p>
                  </div>
                </button>
                <button
                  onClick={() => handleStatusAction('cancel')}
                  disabled={isActionLoading}
                  className="w-full flex items-center gap-3 p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Cancel Reservation</p>
                    <p className="text-xs text-red-600">Cancel this confirmed reservation</p>
                  </div>
                </button>
              </>
            )}

            {(reservation.status === 'cancelled' || reservation.status === 'completed' || reservation.status === 'no-show') && (
              <p className="text-center py-4 text-gray-500">
                This reservation is already {reservation.status}. No further status changes available.
              </p>
            )}
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Reservation"
      >
        <form onSubmit={handleUpdateReservation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Table
            </label>
            <select
              value={editFormData.tableId || ''}
              onChange={(e) => setEditFormData({ ...editFormData, tableId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {tables.map(table => (
                <option key={table._id} value={table._id}>
                  {table.name} ({table.capacity} seats)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Notes
            </label>
            <textarea
              value={editFormData.adminNotes || ''}
              onChange={(e) => setEditFormData({ ...editFormData, adminNotes: e.target.value })}
              placeholder="Internal notes about this reservation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  )
}
