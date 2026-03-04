import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { get, patch } from '../api/client'
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
  User,
  Phone,
  Calendar,
  FileText,
  RefreshCw,
  ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'

interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

interface CateringOrderItem {
  packId: string
  name: string
  pricePerPerson: number
  peopleCount: number
  quantity: number
}

interface DeliveryAddress {
  postalCode: string
  streetName: string
  houseNumber: string
  city: string
}

interface Order {
  _id: string
  orderNumber: string
  userId: {
    _id: string
    email: string
    fullName?: string
    mobile?: string
    address?: string
    postalCode?: string
  }
  items: OrderItem[]
  cateringItems?: CateringOrderItem[]
  subtotal: number
  tax: number
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  pickupTime?: string
  notes?: string
  deliveryAddress: DeliveryAddress
  contactMobile: string
  createdAt: string
  updatedAt: string
}

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    bgColor: 'bg-yellow-500',
    icon: Clock,
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    bgColor: 'bg-blue-500',
    icon: CheckCircle,
  },
  preparing: { 
    label: 'Preparing', 
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    bgColor: 'bg-orange-500',
    icon: ChefHat,
  },
  ready: { 
    label: 'Ready for Pickup', 
    color: 'bg-green-100 text-green-800 border-green-300',
    bgColor: 'bg-green-500',
    icon: Package,
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    bgColor: 'bg-gray-500',
    icon: CheckCircle,
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 border-red-300',
    bgColor: 'bg-red-500',
    icon: XCircle,
  },
}

const allStatuses: Order['status'][] = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchOrder = async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await get<{ success: boolean; order: Order }>({
        url: `admin/orders/${id}`,
      })
      setOrder(response.order)
    } catch (err) {
      console.error('Failed to fetch order:', err)
      setError('Failed to load order details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!order || newStatus === order.status) {
      setShowStatusDropdown(false)
      return
    }
    
    setUpdating(true)
    try {
      await patch({
        url: `admin/orders/${order._id}/status`,
        body: { status: newStatus },
      })
      
      setOrder(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null)
      setShowStatusDropdown(false)
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update order status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Orders
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700">{error || 'Order not found'}</p>
          <button
            onClick={fetchOrder}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[order.status].icon

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Orders
        </button>
        
        <button
          onClick={fetchOrder}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Order Header Card with Status Dropdown */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
              
              {/* Status Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  disabled={updating}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${statusConfig[order.status].color} ${updating ? 'opacity-50' : 'hover:shadow-md cursor-pointer'}`}
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  ) : (
                    <StatusIcon className="h-4 w-4" />
                  )}
                  {statusConfig[order.status].label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border z-50 py-2">
                    <div className="px-3 py-2 border-b mb-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Change Status To</p>
                    </div>
                    {allStatuses.map((status) => {
                      const config = statusConfig[status]
                      const Icon = config.icon
                      const isCurrent = order.status === status
                      
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          disabled={isCurrent}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            isCurrent 
                              ? 'bg-gray-50 cursor-default' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${config.bgColor}`}>
                            <Icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className={`font-medium ${isCurrent ? 'text-gray-400' : 'text-gray-700'}`}>
                            {config.label}
                          </span>
                          {isCurrent && (
                            <span className="ml-auto text-xs text-gray-400">Current</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-500">
              Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
          
          <div className="lg:text-right">
            <p className="text-sm text-gray-500">Order Total</p>
            <p className="text-3xl font-bold text-gray-900">€{order.total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Order Items ({order.items.length + (order.cateringItems?.length || 0)})</h2>
            </div>
            <div className="divide-y">
              {/* Menu Items */}
              {order.items.map((item, idx) => (
                <div key={idx} className="px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">€{item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 text-lg">€{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              {/* Catering Packs */}
              {order.cateringItems && order.cateringItems.length > 0 && order.cateringItems.map((item, idx) => (
                <div key={`catering-${idx}`} className="px-6 py-4 flex justify-between items-center bg-amber-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-bold text-lg">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.peopleCount} people × €{item.pricePerPerson.toFixed(2)}/person
                      </p>
                      <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Catering Pack</span>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 text-lg">€{(item.pricePerPerson * item.peopleCount * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="px-6 py-4 bg-gray-50 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">€{order.subtotal.toFixed(2)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">€{order.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-indigo-600">€{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Order Details */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order.userId?.fullName || 'Not provided'}</p>
                  <p className="text-sm text-gray-500">{order.userId?.email}</p>
                </div>
              </div>
              
              {order.userId?.mobile && (
                <div className="flex items-center gap-3 pt-3 border-t">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{order.userId.mobile}</span>
                </div>
              )}

              {order.userId?.address && (
                <div className="flex items-start gap-3 pt-3 border-t">
                  <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    {order.userId.address}
                    {order.userId.postalCode && `, ${order.userId.postalCode}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-green-50">
              <h2 className="font-semibold text-gray-900">Delivery Address</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {order.deliveryAddress?.streetName} {order.deliveryAddress?.houseNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.deliveryAddress?.postalCode} {order.deliveryAddress?.city}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-3 border-t">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Contact Mobile</p>
                  <p className="text-gray-900 font-medium">{order.contactMobile}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Order Info</h2>
            </div>
            <div className="p-6 space-y-4">
              {order.pickupTime && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Pickup Time</p>
                    <p className="text-gray-900 font-medium">{order.pickupTime}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Created</p>
                  <p className="text-gray-900">{format(new Date(order.createdAt), 'MMM d, h:mm a')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Last Updated</p>
                  <p className="text-gray-900">{format(new Date(order.updatedAt), 'MMM d, h:mm a')}</p>
                </div>
              </div>

              {order.notes && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Special Instructions</p>
                  <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
