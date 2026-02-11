import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  UserX,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { format } from 'date-fns'

interface User {
  id: string
  email: string
  email_verified: boolean
  is_blocked: boolean
  block_reason: string | null
  manual_mode: boolean
  created_at: string
  last_login: string | null
  full_name: string | null
  gender: string | null
  date_of_birth: string | null
  country: string | null
  city: string | null
  profile_photo_url: string | null
  profile_status: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ModalState {
  type: 'verify' | 'block' | 'unblock' | 'toggleManual' | null
  userId: string | null
  userName: string | null
}

export default function Users() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [modalState, setModalState] = useState<ModalState>({ type: null, userId: null, userName: null })
  const [blockReason, setBlockReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toggleManualMode, setToggleManualMode] = useState(false)

  const fetchUsers = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status
      })

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const openToggleManualModal = (userId: string, userName: string | null, currentMode: boolean) => {
    setModalState({ type: 'toggleManual', userId, userName })
    setToggleManualMode(!currentMode)
  }

  const handleToggleUserManual = async () => {
    if (!modalState.userId) return
    setActionLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${modalState.userId}/toggle-manual-mode`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ manualMode: toggleManualMode })
      })

      if (response.ok) {
        fetchUsers(pagination.page)
        closeModal()
      }
    } catch (error) {
      console.error('Failed to toggle manual mode:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(1)
  }

  const closeModal = () => {
    setModalState({ type: null, userId: null, userName: null })
    setBlockReason('')
    setActionLoading(false)
  }

  const openVerifyModal = (userId: string, userName: string | null) => {
    setModalState({ type: 'verify', userId, userName })
  }

  const openBlockModal = (userId: string, userName: string | null) => {
    setModalState({ type: 'block', userId, userName })
    setBlockReason('')
  }

  const openUnblockModal = (userId: string, userName: string | null) => {
    setModalState({ type: 'unblock', userId, userName })
  }

  const handleVerify = async () => {
    if (!modalState.userId) return
    setActionLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${modalState.userId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchUsers(pagination.page)
        closeModal()
      }
    } catch (error) {
      console.error('Failed to verify user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!modalState.userId || !blockReason.trim()) return
    setActionLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${modalState.userId}/block`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: blockReason })
      })

      if (response.ok) {
        fetchUsers(pagination.page)
        closeModal()
      }
    } catch (error) {
      console.error('Failed to block user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (!modalState.userId) return
    setActionLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${modalState.userId}/unblock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchUsers(pagination.page)
        closeModal()
      }
    } catch (error) {
      console.error('Failed to unblock user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or name..."
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </form>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="all">All Users</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            No users found
          </div>
        ) : (
          users.map(user => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600 overflow-hidden flex-shrink-0">
                  {user.profile_photo_url ? (
                    <img src={user.profile_photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.full_name || 'No name'}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  user.email_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.email_verified ? 'Verified' : 'Unverified'}
                </span>
                {user.is_blocked && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Blocked
                  </span>
                )}
                <button
                  onClick={() => openToggleManualModal(user.id, user.full_name, user.manual_mode)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100"
                >
                  {user.manual_mode ? (
                    <>
                      <ToggleRight className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">Manual</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-500">Auto</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {user.country && user.city ? `${user.city}, ${user.country}` : user.country || user.city || '-'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {!user.email_verified && (
                    <button
                      onClick={() => openVerifyModal(user.id, user.full_name)}
                      className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Verify User"
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                  )}
                  {user.is_blocked ? (
                    <button
                      onClick={() => openUnblockModal(user.id, user.full_name)}
                      className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Unblock User"
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => openBlockModal(user.id, user.full_name)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Block User"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Manual Mode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registered</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600 overflow-hidden">
                          {user.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name || 'No name'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{user.country || '-'}</p>
                      <p className="text-sm text-gray-500">{user.city || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.email_verified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.email_verified ? 'Verified' : 'Unverified'}
                        </span>
                        {user.is_blocked && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Blocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => openToggleManualModal(user.id, user.full_name, user.manual_mode)}
                        className="flex items-center gap-1 text-xs"
                        title="Toggle manual mode"
                      >
                        {user.manual_mode ? (
                          <>
                            <ToggleRight className="h-5 w-5 text-green-600" />
                            <span className="text-green-600 font-medium">Manual</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-500">Auto</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!user.email_verified && (
                          <button
                            onClick={() => openVerifyModal(user.id, user.full_name)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Verify User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        {user.is_blocked ? (
                          <button
                            onClick={() => openUnblockModal(user.id, user.full_name)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Unblock User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openBlockModal(user.id, user.full_name)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Block User"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500 hidden sm:block">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Pagination */}
      {pagination.totalPages > 1 && (
        <div className="lg:hidden mt-4 bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => fetchUsers(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchUsers(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Verify Modal */}
      <Modal
        isOpen={modalState.type === 'verify'}
        onClose={closeModal}
        title="Verify User"
        description={`Are you sure you want to verify ${modalState.userName || 'this user'}? This will mark their email as verified.`}
        confirmText="Verify User"
        variant="success"
        onConfirm={handleVerify}
        isLoading={actionLoading}
      />

      {/* Block Modal */}
      <Modal
        isOpen={modalState.type === 'block'}
        onClose={closeModal}
        title="Block User"
        description={`You are about to block ${modalState.userName || 'this user'}. Please provide a reason.`}
        confirmText="Block User"
        variant="danger"
        onConfirm={handleBlock}
        isLoading={actionLoading}
      >
        <textarea
          value={blockReason}
          onChange={(e) => setBlockReason(e.target.value)}
          placeholder="Enter the reason for blocking this user..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
          rows={3}
        />
      </Modal>

      {/* Unblock Modal */}
      <Modal
        isOpen={modalState.type === 'unblock'}
        onClose={closeModal}
        title="Unblock User"
        description={`Are you sure you want to unblock ${modalState.userName || 'this user'}? They will be able to access their account again.`}
        confirmText="Unblock User"
        variant="primary"
        onConfirm={handleUnblock}
        isLoading={actionLoading}
      />

      {/* Toggle Manual Mode Modal */}
      <Modal
        isOpen={modalState.type === 'toggleManual'}
        onClose={closeModal}
        title={toggleManualMode ? 'Enable Manual Mode' : 'Enable Automatic Mode'}
        description={
          toggleManualMode
            ? `${modalState.userName || 'This user'} will not be able to send or receive connection requests until manual mode is disabled.`
            : `${modalState.userName || 'This user'} will be able to send and receive connection requests automatically.`
        }
        confirmText={toggleManualMode ? 'Enable Manual Mode' : 'Enable Auto Mode'}
        variant={toggleManualMode ? 'danger' : 'primary'}
        onConfirm={handleToggleUserManual}
        isLoading={actionLoading}
      />
    </div>
  )
}
