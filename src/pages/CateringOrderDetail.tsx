import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  Package, 
  CreditCard,
  CheckCircle,
  Truck
} from 'lucide-react'
import { useGetCateringOrder, useUpdateDeliveryStatus } from '@/hooks/useCatering'
import type { DeliveryStatus, PaymentStatus, CateringCategory } from '@/types/catering'

export default function CateringOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data, isLoading, error } = useGetCateringOrder(id!)
  const updateStatusMutation = useUpdateDeliveryStatus()

  const order = data?.order

  const handleMarkDelivered = async () => {
    if (!id) return
    try {
      await updateStatusMutation.mutateAsync({ 
        id, 
        deliveryStatus: 'DELIVERED' 
      })
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const getDeliveryStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'YET_TO_BE_DELIVERED':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-red-100 text-red-800">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            Yet to be Delivered
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4" />
            Delivered
          </span>
        )
      default:
        return (
          <span className="inline-flex px-4 py-2 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700"><CheckCircle className="h-4 w-4" /> Paid</span>
      case 'PENDING':
        return <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending</span>
      case 'FAILED':
        return <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-700">Failed</span>
      default:
        return <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-700">{status}</span>
    }
  }

  const getCategoryBadge = (category: CateringCategory) => {
    switch (category) {
      case 'vegetarian': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Vegetarian</span>
      case 'non-vegetarian': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">Non-Vegetarian</span>
      case 'mixed': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Mixed</span>
      default: return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCreatedAt = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Failed to load order details. The order may not exist.
        </div>
        <button
          onClick={() => navigate('/catering-orders')}
          className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </button>
      </div>
    )
  }

  const pack = typeof order.cateringPack === 'object' ? order.cateringPack : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate('/catering-orders')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Created {formatCreatedAt(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          {getDeliveryStatusBadge(order.deliveryStatus)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Catering Pack Info */}
          {pack && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-500" />
                Catering Pack
              </h2>
              <div className="flex gap-4">
                {pack.image && (
                  <img src={pack.image} alt={pack.name} className="h-24 w-24 rounded-lg object-cover" />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{pack.name}</h3>
                    {getCategoryBadge(pack.category)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{pack.description}</p>
                  <div className="text-sm text-gray-500">
                    €{pack.pricePerPerson.toFixed(2)} per person · Min {pack.minPeople} people
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              {pack.menuItems && pack.menuItems.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Included Menu Items</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pack.menuItems.map((item: any) => (
                      <div key={item._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-900">{item.name}</span>
                        <span className="text-sm text-gray-500">€{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delivery Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-500" />
              Delivery Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium text-gray-900">{formatDate(order.deliveryDate)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Time</div>
                  <div className="font-medium text-gray-900">{order.deliveryTime}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">People Count</div>
                  <div className="font-medium text-gray-900">{order.peopleCount} people</div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Delivery Address</div>
                  <div className="font-medium text-gray-900">{order.deliveryAddress.street}</div>
                  <div className="text-gray-600">
                    {order.deliveryAddress.postalCode} {order.deliveryAddress.city}
                  </div>
                </div>
              </div>
            </div>
            {order.notes && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500 mb-1">Special Instructions</div>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">{order.notes}</div>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold">
                    {order.customerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{order.customerName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-5 w-5 text-gray-400" />
                <a href={`mailto:${order.customerEmail}`} className="hover:text-indigo-600">{order.customerEmail}</a>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="h-5 w-5 text-gray-400" />
                <a href={`tel:${order.customerPhone}`} className="hover:text-indigo-600">{order.customerPhone}</a>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-500" />
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Price per person</span>
                <span>€{pack ? pack.pricePerPerson.toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>People count</span>
                <span>× {order.peopleCount}</span>
              </div>
              <div className="pt-3 border-t flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-gray-900 text-xl">€{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status</span>
                {getPaymentStatusBadge(order.paymentStatus)}
              </div>
              {order.paymentId && (
                <div className="mt-2 text-xs text-gray-500">
                  Payment ID: {order.paymentId}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {order.deliveryStatus === 'YET_TO_BE_DELIVERED' && order.paymentStatus === 'PAID' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <button
                onClick={handleMarkDelivered}
                disabled={updateStatusMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-5 w-5" />
                {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Delivered'}
              </button>
            </div>
          )}

          {order.deliveryStatus === 'DELIVERED' && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <div className="font-semibold text-green-800">Order Delivered</div>
              <div className="text-sm text-green-600 mt-1">This order has been marked as delivered</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
