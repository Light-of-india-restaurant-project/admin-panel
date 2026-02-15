import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Calendar, Clock, Users, Phone, Eye, Check, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { 
  useGetReservations, 
  useGetTables,
} from '@/hooks/useReservations'
import type { ReservationStatus, Table } from '@/types/reservation'

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: X },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: Check },
  'no-show': { label: 'No Show', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
}

export default function Reservations() {
  const navigate = useNavigate()
  
  // Pagination & Filter states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Query params
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filterStatus && { status: filterStatus as ReservationStatus }),
    ...(filterDate && { date: filterDate }),
  }), [page, pageSize, debouncedSearch, filterStatus, filterDate])

  // React Query hooks
  const { data, isLoading } = useGetReservations(queryParams)
  const { data: tablesData } = useGetTables({ limit: 100 })

  const reservations = data?.data || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
  const tables = tablesData?.data || []

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getTableName = (tableId: Table | string) => {
    if (typeof tableId === 'object') return tableId.name
    const table = tables.find(t => t._id === tableId)
    return table?.name || 'Unknown'
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage table reservations and bookings</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or confirmation code..."
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
            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear date
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading reservations...</div>
        ) : reservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No reservations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map((reservation) => {
                  const statusConfig = STATUS_CONFIG[reservation.status]
                  const StatusIcon = statusConfig.icon
                  return (
                    <tr key={reservation._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{reservation.name}</div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {reservation.guests}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {reservation.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(reservation.date)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {reservation.time} - {reservation.endTime}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-900">
                        {getTableName(reservation.tableId)}
                      </td>
                      <td className="px-4 py-4">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {reservation.confirmationCode}
                        </code>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => navigate(`/reservations/${reservation._id}`)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
              <span>of {pagination.total} reservations</span>
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
    </div>
  )
}
