import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Phone, 
  Mail, 
  User,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Check,
  X,
  Trash2,
  MessageSquare
} from 'lucide-react'
import { 
  useGetSimpleReservation, 
  useAcceptSimpleReservation,
  useRejectSimpleReservation,
  useCancelSimpleReservation,
  useDeleteSimpleReservation,
} from '@/hooks/useReservations'
import type { SimpleReservationStatus } from '@/types/reservation'

const STATUS_CONFIG: Record<SimpleReservationStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-green-800', bgColor: 'bg-green-100', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-800', bgColor: 'bg-red-100', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: Ban },
}

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  confirmColor: string
  onConfirm: () => void
  onCancel: () => void
  showReasonInput?: boolean
  reasonLabel?: string
  reasonValue?: string
  onReasonChange?: (value: string) => void
  isLoading?: boolean
}

function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmLabel, 
  confirmColor, 
  onConfirm, 
  onCancel,
  showReasonInput,
  reasonLabel,
  reasonValue,
  onReasonChange,
  isLoading
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {showReasonInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {reasonLabel} *
            </label>
            <textarea
              value={reasonValue}
              onChange={(e) => onReasonChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Enter reason..."
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || (showReasonInput && !reasonValue?.trim())}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmColor} flex items-center gap-2`}
          >
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SimpleReservationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Modal states
  const [acceptModal, setAcceptModal] = useState(false)
  const [rejectModal, setRejectModal] = useState({ isOpen: false, reason: '' })
  const [cancelModal, setCancelModal] = useState({ isOpen: false, reason: '' })
  const [deleteModal, setDeleteModal] = useState(false)

  // React Query hooks
  const { data, isLoading, error } = useGetSimpleReservation(id || '')
  const acceptMutation = useAcceptSimpleReservation()
  const rejectMutation = useRejectSimpleReservation()
  const cancelMutation = useCancelSimpleReservation()
  const deleteMutation = useDeleteSimpleReservation()

  const reservation = data?.data

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleAccept = async () => {
    if (!id) return
    try {
      await acceptMutation.mutateAsync({ id })
      setAcceptModal(false)
    } catch (error) {
      console.error('Failed to accept reservation:', error)
    }
  }

  const handleReject = async () => {
    if (!id || !rejectModal.reason.trim()) return
    try {
      await rejectMutation.mutateAsync({ id, rejectionReason: rejectModal.reason })
      setRejectModal({ isOpen: false, reason: '' })
    } catch (error) {
      console.error('Failed to reject reservation:', error)
    }
  }

  const handleCancel = async () => {
    if (!id || !cancelModal.reason.trim()) return
    try {
      await cancelMutation.mutateAsync({ id, cancellationReason: cancelModal.reason })
      setCancelModal({ isOpen: false, reason: '' })
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteMutation.mutateAsync(id)
      navigate('/simple-reservations')
    } catch (error) {
      console.error('Failed to delete reservation:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Reservation not found</h3>
          <p className="mt-2 text-gray-500">The reservation you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/simple-reservations')}
            className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to reservations
          </button>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_CONFIG[reservation.status]?.icon || Clock

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/simple-reservations')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reservation Details</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage reservation</p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {reservation.status === 'pending' && (
            <>
              <button
                onClick={() => setAcceptModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="h-4 w-4" />
                Accept
              </button>
              <button
                onClick={() => setRejectModal({ isOpen: true, reason: '' })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </>
          )}
          {(reservation.status === 'pending' || reservation.status === 'accepted') && (
            <button
              onClick={() => setCancelModal({ isOpen: true, reason: '' })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Ban className="h-4 w-4" />
              Cancel
            </button>
          )}
          <button
            onClick={() => setDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${STATUS_CONFIG[reservation.status]?.bgColor || 'bg-gray-100'}`}>
                <StatusIcon className={`h-6 w-6 ${STATUS_CONFIG[reservation.status]?.color || 'text-gray-800'}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {STATUS_CONFIG[reservation.status]?.label || reservation.status}
                </h2>
                <p className="text-sm text-gray-500">
                  Last updated: {formatDateTime(reservation.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{reservation.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{reservation.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="font-medium text-gray-900">{reservation.contactNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Number of Guests</p>
                  <p className="font-medium text-gray-900">
                    {reservation.numberOfGuests} {reservation.numberOfGuests === 1 ? 'guest' : 'guests'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservation Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Reservation Date</p>
                  <p className="font-medium text-gray-900">{formatDate(reservation.reservationDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Request Submitted</p>
                  <p className="font-medium text-gray-900">{formatDateTime(reservation.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {(reservation.rejectionReason || reservation.cancellationReason || reservation.adminNote) && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes & Reasons
              </h3>
              <div className="space-y-4">
                {reservation.rejectionReason && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                    <p className="text-red-700 mt-1">{reservation.rejectionReason}</p>
                  </div>
                )}
                {reservation.cancellationReason && (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                    <p className="text-sm font-medium text-orange-800">Cancellation Reason</p>
                    <p className="text-orange-700 mt-1">{reservation.cancellationReason}</p>
                  </div>
                )}
                {reservation.adminNote && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Admin Note</p>
                    <p className="text-blue-700 mt-1">{reservation.adminNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">ID</span>
                <span className="font-mono text-sm text-gray-900">{reservation._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[reservation.status]?.bgColor || 'bg-gray-100'} ${STATUS_CONFIG[reservation.status]?.color || 'text-gray-800'}`}>
                  {STATUS_CONFIG[reservation.status]?.label || reservation.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Guests</span>
                <span className="text-gray-900">{reservation.numberOfGuests}</span>
              </div>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Customer</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${reservation.email}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Send Email
              </a>
              <a
                href={`tel:${reservation.contactNumber}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call Customer
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={acceptModal}
        title="Accept Reservation"
        message={`Are you sure you want to accept ${reservation.name}'s reservation?`}
        confirmLabel="Accept"
        confirmColor="bg-green-600 hover:bg-green-700"
        onConfirm={handleAccept}
        onCancel={() => setAcceptModal(false)}
        isLoading={acceptMutation.isPending}
      />

      <ConfirmModal
        isOpen={rejectModal.isOpen}
        title="Reject Reservation"
        message={`Please provide a reason for rejecting ${reservation.name}'s reservation.`}
        confirmLabel="Reject"
        confirmColor="bg-red-600 hover:bg-red-700"
        onConfirm={handleReject}
        onCancel={() => setRejectModal({ isOpen: false, reason: '' })}
        showReasonInput
        reasonLabel="Rejection Reason"
        reasonValue={rejectModal.reason}
        onReasonChange={(value) => setRejectModal(prev => ({ ...prev, reason: value }))}
        isLoading={rejectMutation.isPending}
      />

      <ConfirmModal
        isOpen={cancelModal.isOpen}
        title="Cancel Reservation"
        message={`Please provide a reason for cancelling ${reservation.name}'s reservation.`}
        confirmLabel="Cancel Reservation"
        confirmColor="bg-orange-600 hover:bg-orange-700"
        onConfirm={handleCancel}
        onCancel={() => setCancelModal({ isOpen: false, reason: '' })}
        showReasonInput
        reasonLabel="Cancellation Reason"
        reasonValue={cancelModal.reason}
        onReasonChange={(value) => setCancelModal(prev => ({ ...prev, reason: value }))}
        isLoading={cancelMutation.isPending}
      />

      <ConfirmModal
        isOpen={deleteModal}
        title="Delete Reservation"
        message={`Are you sure you want to permanently delete this reservation? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="bg-red-600 hover:bg-red-700"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
