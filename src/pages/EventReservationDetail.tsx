import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle, Mail, Phone, Users, XCircle } from 'lucide-react'
import { useCancelEventReservation, useGetEventReservation } from '@/hooks/useEventReservations'

export default function EventReservationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useGetEventReservation(id || '')
  const cancelMutation = useCancelEventReservation()

  const [reason, setReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)

  const reservation = data?.data

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const handleCancel = async () => {
    if (!id || !reservation) return
    await cancelMutation.mutateAsync({ id, cancellationReason: reason || undefined })
    setShowCancel(false)
  }

  if (isLoading) {
    return <div className="p-6">Loading event reservation...</div>
  }

  if (!reservation) {
    return <div className="p-6">Event reservation not found.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/event-reservations')} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Event Reservation Detail</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
          <div className="space-y-3 text-gray-700">
            <div className="font-medium text-gray-900">{reservation.name}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{reservation.email}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{reservation.contactNumber}</div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4" />{reservation.numberOfGuests} guests</div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDate(reservation.reservationDate)}</div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment & Status</h2>
          <div className="space-y-3 text-gray-700">
            <div><span className="font-medium">Amount:</span> {reservation.currency} {reservation.amountPaid.toFixed(2)}</div>
            <div><span className="font-medium">Payment Status:</span> {reservation.paymentStatus}</div>
            <div><span className="font-medium">Payment ID:</span> {reservation.paymentId}</div>
            <div><span className="font-medium">Confirmation Code:</span> <code className="bg-gray-100 px-2 py-1 rounded">{reservation.confirmationCode}</code></div>
            <div>
              <span className="font-medium mr-2">Reservation Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {reservation.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {reservation.status === 'confirmed' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <button
            onClick={() => setShowCancel(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            <XCircle className="h-4 w-4" />
            Cancel Reservation
          </button>
        </div>
      )}

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancel(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Reservation</h3>
            <p className="text-gray-600 mb-4">Optional reason to include in admin record.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Enter reason"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setShowCancel(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reservation.cancellationReason && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="font-medium">Cancellation Reason</div>
          <div className="mt-1 text-sm">{reservation.cancellationReason}</div>
        </div>
      )}

      <div className="text-sm text-gray-500 flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        Customer must bring confirmation email and this unique code.
      </div>
    </div>
  )
}
