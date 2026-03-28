import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  Phone, 
  Eye, 
  Check, 
  X, 
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  ArrowUpDown,
  XCircle as ClearIcon
} from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { 
  useGetSimpleReservations, 
  useAcceptSimpleReservation,
  useRejectSimpleReservation,
  useCancelSimpleReservation,
} from '@/hooks/useReservations'
import type { SimpleReservationStatus, SimpleReservation } from '@/types/reservation'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const SORT_OPTIONS = [
  { value: 'reservationDate:asc', label: 'Date (Upcoming First)' },
  { value: 'reservationDate:desc', label: 'Date (Latest First)' },
  { value: 'createdAt:desc', label: 'Created (Newest First)' },
  { value: 'createdAt:asc', label: 'Created (Oldest First)' },
]

const STATUS_CONFIG: Record<SimpleReservationStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: Ban },
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
  onReasonChange
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
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={showReasonInput && !reasonValue?.trim()}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SimpleReservations() {
  const navigate = useNavigate()
  
  // Pagination & Filter states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [sortBy, setSortBy] = useState('reservationDate:asc')

  // Modal states
  const [acceptModal, setAcceptModal] = useState<{ isOpen: boolean; reservation: SimpleReservation | null }>({
    isOpen: false,
    reservation: null,
  })
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; reservation: SimpleReservation | null; reason: string }>({
    isOpen: false,
    reservation: null,
    reason: '',
  })
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; reservation: SimpleReservation | null; reason: string }>({
    isOpen: false,
    reservation: null,
    reason: '',
  })

  // Query params
  const queryParams = useMemo(() => ({
    skip: (page - 1) * pageSize,
    limit: pageSize,
    sortBy,
    ...(filterStatus && { status: filterStatus as SimpleReservationStatus }),
    ...(filterDate && { startDate: filterDate, endDate: filterDate }),
  }), [page, pageSize, filterStatus, filterDate, sortBy])

  // React Query hooks
  const { data, isLoading } = useGetSimpleReservations(queryParams)
  const acceptMutation = useAcceptSimpleReservation()
  const rejectMutation = useRejectSimpleReservation()
  const cancelMutation = useCancelSimpleReservation()

  const reservations = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  // Filter reservations by search (client-side for name, email, phone)
  const filteredReservations = useMemo(() => {
    if (!debouncedSearch) return reservations
    const search = debouncedSearch.toLowerCase()
    return reservations.filter(r => 
      r.name.toLowerCase().includes(search) ||
      r.email.toLowerCase().includes(search) ||
      r.contactNumber.includes(search)
    )
  }, [reservations, debouncedSearch])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleAccept = (reservation: SimpleReservation) => {
    setAcceptModal({ isOpen: true, reservation })
  }

  const handleReject = (reservation: SimpleReservation) => {
    setRejectModal({ isOpen: true, reservation, reason: '' })
  }

  const handleCancel = (reservation: SimpleReservation) => {
    setCancelModal({ isOpen: true, reservation, reason: '' })
  }

  const confirmAccept = async () => {
    if (!acceptModal.reservation) return
    try {
      await acceptMutation.mutateAsync({ id: acceptModal.reservation._id })
      setAcceptModal({ isOpen: false, reservation: null })
    } catch (error) {
      console.error('Failed to accept reservation:', error)
    }
  }

  const confirmReject = async () => {
    if (!rejectModal.reservation || !rejectModal.reason.trim()) return
    try {
      await rejectMutation.mutateAsync({ 
        id: rejectModal.reservation._id, 
        rejectionReason: rejectModal.reason 
      })
      setRejectModal({ isOpen: false, reservation: null, reason: '' })
    } catch (error) {
      console.error('Failed to reject reservation:', error)
    }
  }

  const confirmCancel = async () => {
    if (!cancelModal.reservation || !cancelModal.reason.trim()) return
    try {
      await cancelMutation.mutateAsync({ 
        id: cancelModal.reservation._id, 
        cancellationReason: cancelModal.reason 
      })
      setCancelModal({ isOpen: false, reservation: null, reason: '' })
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Simple Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage reservation requests from customers</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setPage(1) }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {filterDate && (
                <button
                  onClick={() => { setFilterDate(''); setPage(1) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear date filter"
                >
                  <ClearIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reservations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterStatus || filterDate ? 'Try adjusting your filters' : 'Reservation requests will appear here'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReservations.map((reservation) => {
                    const StatusIcon = STATUS_CONFIG[reservation.status]?.icon || Clock
                    return (
                      <tr key={reservation._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{reservation.name}</div>
                          <div className="text-sm text-gray-500">{reservation.email}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reservation.contactNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(reservation.reservationDate)}
                            {reservation.reservationTime && (
                              <span className="text-gray-600 font-medium">@ {reservation.reservationTime}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Requested: {formatDate(reservation.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Users className="h-4 w-4 text-gray-400" />
                            {reservation.numberOfGuests} {reservation.numberOfGuests === 1 ? 'guest' : 'guests'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[reservation.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                            <StatusIcon className="h-3 w-3" />
                            {STATUS_CONFIG[reservation.status]?.label || reservation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/simple-reservations/${reservation._id}`)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {reservation.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAccept(reservation)}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Accept reservation"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(reservation)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Reject reservation"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {(reservation.status === 'pending' || reservation.status === 'accepted') && (
                              <button
                                onClick={() => handleCancel(reservation)}
                                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Cancel reservation"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700">of {total} results</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Accept Confirmation Modal */}
      <ConfirmModal
        isOpen={acceptModal.isOpen}
        title="Accept Reservation"
        message={`Are you sure you want to accept the reservation for ${acceptModal.reservation?.name}?`}
        confirmLabel="Accept"
        confirmColor="bg-green-600 hover:bg-green-700"
        onConfirm={confirmAccept}
        onCancel={() => setAcceptModal({ isOpen: false, reservation: null })}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={rejectModal.isOpen}
        title="Reject Reservation"
        message={`Please provide a reason for rejecting ${rejectModal.reservation?.name}'s reservation.`}
        confirmLabel="Reject"
        confirmColor="bg-red-600 hover:bg-red-700"
        onConfirm={confirmReject}
        onCancel={() => setRejectModal({ isOpen: false, reservation: null, reason: '' })}
        showReasonInput
        reasonLabel="Rejection Reason"
        reasonValue={rejectModal.reason}
        onReasonChange={(value) => setRejectModal(prev => ({ ...prev, reason: value }))}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModal.isOpen}
        title="Cancel Reservation"
        message={`Please provide a reason for cancelling ${cancelModal.reservation?.name}'s reservation.`}
        confirmLabel="Cancel Reservation"
        confirmColor="bg-orange-600 hover:bg-orange-700"
        onConfirm={confirmCancel}
        onCancel={() => setCancelModal({ isOpen: false, reservation: null, reason: '' })}
        showReasonInput
        reasonLabel="Cancellation Reason"
        reasonValue={cancelModal.reason}
        onReasonChange={(value) => setCancelModal(prev => ({ ...prev, reason: value }))}
      />
    </div>
  )
}
