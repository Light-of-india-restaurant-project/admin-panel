import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { get } from '../api/client'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChefHat,
  Package,
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'

interface OrderItem {
  menuItemId: string
  name: string
  price: number
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
  }
  items: OrderItem[]
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

interface OrdersResponse {
  success: boolean
  message: string
  orders: Order[]
  total: number
  page: number
  limit: number
}

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: CheckCircle,
  },
  preparing: { 
    label: 'Preparing', 
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: ChefHat,
  },
  ready: { 
    label: 'Ready', 
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: Package,
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: CheckCircle,
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
  },
}

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        limit,
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      const response = await get<OrdersResponse>({
        url: 'admin/orders',
        params,
      })
      
      setOrders(response.orders || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, limit, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  const totalPages = Math.ceil(total / limit)

  const filteredOrders = orders.filter(order => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.userId?.email?.toLowerCase().includes(searchLower) ||
      order.userId?.fullName?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-500 mt-1">View and manage customer orders</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div>
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const statusInfo = statusConfig[order.status]
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${order._id}`)}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500 md:hidden">
                          {format(new Date(order.createdAt), 'MMM d, HH:mm')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                          {order.userId?.fullName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[120px]">{order.userId?.email}</div>
                        {order.deliveryAddress?.postalCode && (
                          <div className="text-xs text-green-600 font-medium mt-0.5">
                            📍 {order.deliveryAddress.postalCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-sm text-gray-900">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500 max-w-[150px] truncate">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">
                          €{order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span className="hidden sm:inline">{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                        <div>{format(new Date(order.createdAt), 'MMM d')}</div>
                        <div className="text-xs">{format(new Date(order.createdAt), 'HH:mm')}</div>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-3 py-1 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
