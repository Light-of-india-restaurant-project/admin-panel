import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { 
  ArrowLeft, 
  UserCheck, 
  UserX, 
  Trash2,
  Mail,
  MapPin,
  Calendar,
  Heart,
  Shield,
  CreditCard,
  XCircle,
  Receipt,
  Package,
  Coins
} from 'lucide-react'
import { format } from 'date-fns'

// Modal state types
type ModalType = 'verify' | 'block' | 'unblock' | 'delete' | 'cancelSubscription' | null

interface Subscription {
  id: string
  plan_id: string
  plan_code: string
  plan_name: string
  status: string
  billing_cycle: string
  amount_cents: number
  currency: string
  start_date: string
  end_date: string
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
}

interface Payment {
  id: string
  mollie_payment_id: string
  status: string
  amount_cents: number
  currency: string
  description: string
  metadata: {
    type?: string
    planCode?: string
    pack_id?: string
    connects_count?: number
  }
  created_at: string
}

interface ConnectsInfo {
  connects_remaining: number
  connects_purchased_total: number
  connects_used_total: number
  last_purchase_at: string | null
}

interface UserDetail {
  user: {
    id: string
    email: string
    email_verified: boolean
    is_blocked: boolean
    block_reason: string | null
    blocked_at: string | null
    created_at: string
    last_login: string | null
  }
  profile: {
    full_name: string
    gender: string
    date_of_birth: string
    marital_status: string
    madhhab: string
    prayer_frequency: string
    country: string
    city: string
    education_level: string
    occupation: string
    height_cm: number
    bio: string
    looking_for: string
    profile_photo_url: string | null
    profile_status: string
  } | null
  matchStats: {
    requests_sent: number
    requests_received: number
    approved_matches: number
  }
  subscription: Subscription | null
  connectsInfo: ConnectsInfo | null
  recentPayments: Payment[]
}

export default function UserDetail() {
  const { userId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [blockReason, setBlockReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          setData(await response.json())
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId, token])

  const closeModal = () => {
    setActiveModal(null)
    setBlockReason('')
    setCancelReason('')
    setIsActionLoading(false)
  }

  const handleVerify = async () => {
    setIsActionLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setData(prev => prev ? {
          ...prev,
          user: { ...prev.user, email_verified: true }
        } : null)
        closeModal()
      }
    } catch (error) {
      console.error('Failed to verify user:', error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!blockReason.trim()) return
    setIsActionLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: blockReason })
      })

      if (response.ok) {
        setData(prev => prev ? {
          ...prev,
          user: { ...prev.user, is_blocked: true, block_reason: blockReason }
        } : null)
        closeModal()
      }
    } catch (error) {
      console.error('Failed to block user:', error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUnblock = async () => {
    setIsActionLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}/unblock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setData(prev => prev ? {
          ...prev,
          user: { ...prev.user, is_blocked: false, block_reason: null }
        } : null)
        closeModal()
      }
    } catch (error) {
      console.error('Failed to unblock user:', error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsActionLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}?hardDelete=true`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        navigate('/users')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsActionLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}/cancel-subscription`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason || 'Cancelled by admin' })
      })

      if (response.ok) {
        setData(prev => prev ? {
          ...prev,
          subscription: prev.subscription ? { ...prev.subscription, status: 'cancelled', cancelled_at: new Date().toISOString() } : null
        } : null)
        closeModal()
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
    } finally {
      setIsActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-gray-500">User not found</p>
      </div>
    )
  }

  const { user, profile, matchStats, subscription, connectsInfo, recentPayments } = data

  const formatValue = (value: string | null) => {
    if (!value) return '-'
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/users')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 overflow-hidden flex-shrink-0">
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {profile?.full_name || 'No name provided'}
                </h2>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                {profile && (
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    {profile.city}, {profile.country}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.email_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                  {user.is_blocked && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Blocked
                    </span>
                  )}
                  {profile?.gender && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {formatValue(profile.gender)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {user.is_blocked && user.block_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Block Reason:</strong> {user.block_reason}
                </p>
              </div>
            )}
          </div>

          {/* Profile Details */}
          {profile && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{profile.date_of_birth ? format(new Date(profile.date_of_birth), 'MMM d, yyyy') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Marital Status</p>
                  <p className="font-medium">{formatValue(profile.marital_status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Madhhab</p>
                  <p className="font-medium">{formatValue(profile.madhhab)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prayer Frequency</p>
                  <p className="font-medium">{formatValue(profile.prayer_frequency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Education</p>
                  <p className="font-medium">{formatValue(profile.education_level)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Occupation</p>
                  <p className="font-medium">{profile.occupation || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Height</p>
                  <p className="font-medium">{profile.height_cm ? `${profile.height_cm} cm` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profile Status</p>
                  <p className="font-medium">{formatValue(profile.profile_status)}</p>
                </div>
              </div>

              {profile.bio && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Bio</p>
                  <p className="font-medium mt-1">{profile.bio}</p>
                </div>
              )}

              {profile.looking_for && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Looking For</p>
                  <p className="font-medium mt-1">{profile.looking_for}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {!user.email_verified && (
                <button
                  onClick={() => setActiveModal('verify')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <UserCheck className="h-4 w-4" />
                  Verify User
                </button>
              )}

              {user.is_blocked ? (
                <button
                  onClick={() => setActiveModal('unblock')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Unblock User
                </button>
              ) : (
                <button
                  onClick={() => setActiveModal('block')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <UserX className="h-4 w-4" />
                  Block User
                </button>
              )}

              <button
                onClick={() => setActiveModal('delete')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </button>
            </div>
          </div>

          {/* Subscription & Connects */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Subscription & Connects
            </h3>

            {/* Connects Balance */}
            {connectsInfo && (
              <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    Connects Balance
                  </span>
                  <span className="text-2xl font-bold text-yellow-600">{connectsInfo.connects_remaining}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                  <div>
                    <span className="block text-gray-400">Total Purchased</span>
                    <span className="font-semibold text-gray-700">{connectsInfo.connects_purchased_total}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Total Used</span>
                    <span className="font-semibold text-gray-700">{connectsInfo.connects_used_total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Info */}
            {subscription ? (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs text-gray-400 uppercase tracking-wider pt-2">Active Subscription</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : subscription.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Start Date</span>
                  <span className="font-medium">{format(new Date(subscription.start_date), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">End Date</span>
                  <span className="font-medium">{format(new Date(subscription.end_date), 'MMM d, yyyy')}</span>
                </div>
                {subscription.amount_cents && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-medium">{subscription.currency} {(subscription.amount_cents / 100).toFixed(2)}</span>
                  </div>
                )}
                {subscription.cancelled_at && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Cancelled:</strong> {format(new Date(subscription.cancelled_at), 'MMM d, yyyy HH:mm')}
                    </p>
                    {subscription.cancel_reason && (
                      <p className="text-sm text-red-600 mt-1">
                        <strong>Reason:</strong> {subscription.cancel_reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Cancel Subscription Button */}
                {subscription.status === 'active' && (
                  <button
                    onClick={() => setActiveModal('cancelSubscription')}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Subscription
                  </button>
                )}
              </div>
            ) : (
              <div className={`text-center ${connectsInfo ? 'py-3 border-t mt-2' : 'py-4'}`}>
                <p className="text-gray-500 text-sm">No active subscription plan</p>
              </div>
            )}

            {/* No connects and no subscription */}
            {!connectsInfo && !subscription && (
              <div className="text-center py-6 border-t mt-2">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <Coins className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No Purchases Yet</p>
                <p className="text-sm text-gray-400 mt-1">User hasn't purchased connects or subscription</p>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              Payment History
            </h3>
            
            {recentPayments && recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {payment.metadata?.type === 'connect_pack' ? (
                          <Package className="h-4 w-4 text-yellow-500" />
                        ) : payment.metadata?.planCode ? (
                          <CreditCard className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <Receipt className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium text-sm text-gray-900">{payment.description}</p>
                          <p className="text-xs text-gray-500">{format(new Date(payment.created_at), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{payment.currency} {(payment.amount_cents / 100).toFixed(2)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : payment.status === 'pending' || payment.status === 'open'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                    {payment.metadata?.type === 'connect_pack' && payment.metadata.connects_count && (
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        {payment.metadata.connects_count} connects purchased
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No payment history</p>
              </div>
            )}
          </div>

          {/* Match Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Match Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="text-gray-600 text-sm">Interest Requests Sent</span>
                <span className="font-bold text-blue-600">{matchStats.requests_sent}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <span className="text-gray-600 text-sm">Interest Requests Received</span>
                <span className="font-bold text-purple-600">{matchStats.requests_received}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
                <span className="text-gray-600 text-sm">Mutual Matches</span>
                <span className="font-bold text-pink-600">{matchStats.approved_matches}</span>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Registered
                </p>
                <p className="font-medium">{format(new Date(user.created_at), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium">
                  {user.last_login 
                    ? format(new Date(user.last_login), 'MMM d, yyyy HH:mm') 
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verify Modal */}
      <Modal
        isOpen={activeModal === 'verify'}
        onClose={closeModal}
        onConfirm={handleVerify}
        title="Verify User"
        description={`Are you sure you want to verify ${profile?.full_name || user.email}? This will mark their email as verified.`}
        confirmText="Verify User"
        variant="success"
        isLoading={isActionLoading}
      />

      {/* Block Modal */}
      <Modal
        isOpen={activeModal === 'block'}
        onClose={closeModal}
        onConfirm={handleBlock}
        title="Block User"
        description={`Please provide a reason for blocking ${profile?.full_name || user.email}.`}
        confirmText="Block User"
        variant="danger"
        isLoading={isActionLoading}
      >
        <textarea
          value={blockReason}
          onChange={(e) => setBlockReason(e.target.value)}
          placeholder="Enter the reason for blocking this user..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          rows={4}
          autoFocus
        />
        {!blockReason.trim() && (
          <p className="mt-2 text-sm text-red-500">Please provide a block reason</p>
        )}
      </Modal>

      {/* Unblock Modal */}
      <Modal
        isOpen={activeModal === 'unblock'}
        onClose={closeModal}
        onConfirm={handleUnblock}
        title="Unblock User"
        description={`Are you sure you want to unblock ${profile?.full_name || user.email}? They will be able to access the platform again.`}
        confirmText="Unblock User"
        variant="primary"
        isLoading={isActionLoading}
      />

      {/* Delete Modal */}
      <Modal
        isOpen={activeModal === 'delete'}
        onClose={closeModal}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to permanently delete ${profile?.full_name || user.email}? This action cannot be undone and will remove all their data.`}
        confirmText="Delete User"
        variant="danger"
        isLoading={isActionLoading}
      />

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={activeModal === 'cancelSubscription'}
        onClose={closeModal}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        description={`Are you sure you want to cancel the subscription for ${profile?.full_name || user.email}? This will immediately revoke their premium access.`}
        confirmText="Cancel Subscription"
        variant="danger"
        isLoading={isActionLoading}
      >
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Enter the reason for cancellation (optional)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          rows={3}
          autoFocus
        />
      </Modal>
    </div>
  )
}
