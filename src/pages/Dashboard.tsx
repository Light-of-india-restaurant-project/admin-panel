import { UtensilsCrossed, List, TrendingUp, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStats } from '@/hooks/useMenu'

export default function Dashboard() {
  const navigate = useNavigate()
  const { stats, recentItems, isLoading } = useDashboardStats()

  const statCards = [
    { label: 'Total Categories', value: stats.totalCategories, icon: List, color: 'bg-blue-500' },
    { label: 'Total Items', value: stats.totalItems, icon: UtensilsCrossed, color: 'bg-green-500' },
    { label: 'Active Items', value: stats.activeItems, icon: Eye, color: 'bg-purple-500' },
    { label: 'Dine-in Items', value: stats.dineInItems, icon: TrendingUp, color: 'bg-orange-500' },
    { label: 'Takeaway Items', value: stats.takeawayItems, icon: TrendingUp, color: 'bg-teal-500' },
  ]

  const getMenuTypeLabel = (type: string) => {
    switch (type) {
      case 'dine-in': return 'Dine-in'
      case 'takeaway': return 'Takeaway'
      case 'both': return 'Both'
      default: return type
    }
  }

  const getMenuTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'dine-in': return 'bg-blue-100 text-blue-800'
      case 'takeaway': return 'bg-orange-100 text-orange-800'
      case 'both': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className={`bg-white rounded-xl shadow-sm p-3 sm:p-5 transition-opacity ${isLoading ? 'animate-pulse' : ''}`}>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`${stat.color} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/menu-categories')}
          className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="bg-indigo-100 p-3 rounded-lg">
            <List className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Manage Categories</p>
            <p className="text-sm text-gray-500">Add or edit menu categories</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/menu-items')}
          className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="bg-green-100 p-3 rounded-lg">
            <UtensilsCrossed className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Manage Menu Items</p>
            <p className="text-sm text-gray-500">Add or edit menu items</p>
          </div>
        </button>
      </div>

      {/* Recent Items */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recently Added Items</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentItems.map(item => (
            <div key={item._id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 hover:bg-gray-50">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-xl flex-shrink-0">
                  {item.category?.icon || '🍽️'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{item.category?.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pl-14 sm:pl-0">
                <span className="font-semibold text-gray-900">€{item.price.toFixed(2)}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getMenuTypeBadgeColor(item.menuType)}`}>
                  {getMenuTypeLabel(item.menuType)}
                </span>
              </div>
            </div>
          ))}
          {recentItems.length === 0 && !isLoading && (
            <div className="p-8 text-center">
              <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No menu items yet</p>
              <button
                onClick={() => navigate('/menu-items')}
                className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                Add your first item →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
