import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  LogOut,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  List,
  UtensilsCrossed,
  Package,
  MapPin,
  CalendarDays,
  Armchair,
  Settings,
  ClipboardList,
  Building2,
  LayoutList
} from 'lucide-react'

type NavItem = {
  to: string
  icon: React.ElementType
  label: string
}

type NavGroup = {
  icon: React.ElementType
  label: string
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

function isNavGroup(item: NavEntry): item is NavGroup {
  return 'children' in item
}

export default function Layout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Sidebar states
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Reservations'])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-expand group when navigating to child route
  useEffect(() => {
    const reservationRoutes = ['/reservations', '/floors', '/rows', '/tables', '/reservation-settings']
    if (reservationRoutes.some(route => location.pathname.startsWith(route))) {
      setExpandedGroups(prev => prev.includes('Reservations') ? prev : [...prev, 'Reservations'])
    }
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    )
  }

  const navItems: NavEntry[] = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/orders', icon: Package, label: 'Orders' },
    { 
      icon: ClipboardList, 
      label: 'Reservations',
      children: [
        { to: '/reservations', icon: CalendarDays, label: 'All Reservations' },
        { to: '/floors', icon: Building2, label: 'Floors' },
        { to: '/rows', icon: LayoutList, label: 'Rows' },
        { to: '/tables', icon: Armchair, label: 'Tables' },
        { to: '/reservation-settings', icon: Settings, label: 'Settings' },
      ]
    },
    { to: '/delivery-zones', icon: MapPin, label: 'Delivery Zones' },
    { to: '/menu-categories', icon: List, label: 'Menu Categories' },
    { to: '/menu-items', icon: UtensilsCrossed, label: 'Menu Items' },
  ]

  const isGroupActive = (group: NavGroup) => {
    return group.children.some(child => location.pathname.startsWith(child.to))
  }

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className={`p-4 border-b border-slate-700 ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
          <Shield className={`text-indigo-400 ${isCollapsed ? 'h-8 w-8' : 'h-8 w-8'}`} />
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">Light of India</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={isNavGroup(item) ? item.label : item.to}>
              {isNavGroup(item) ? (
                // Group with children
                <div>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-2.5 rounded-lg transition-colors ${
                      isGroupActive(item)
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${
                          expandedGroups.includes(item.label) ? 'rotate-180' : ''
                        }`} 
                      />
                    )}
                  </button>
                  {!isCollapsed && expandedGroups.includes(item.label) && (
                    <ul className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                      {item.children.map(child => (
                        <li key={child.to}>
                          <NavLink
                            to={child.to}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                              }`
                            }
                          >
                            <child.icon className="h-4 w-4 flex-shrink-0" />
                            <span>{child.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isCollapsed && (
                    // Show tooltip or popover on hover when collapsed - for now just show first item
                    <div className="hidden group-hover:block absolute left-full ml-2 bg-slate-800 rounded-lg shadow-lg p-2 min-w-[160px]">
                      {item.children.map(child => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded text-sm ${
                              isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                            }`
                          }
                        >
                          <child.icon className="h-4 w-4" />
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Regular nav item
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className={`p-4 border-t border-slate-700 ${isCollapsed ? 'px-2' : ''}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-semibold flex-shrink-0">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{admin?.name}</p>
                <p className="text-xs text-slate-400 truncate">{admin?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div 
              className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-semibold cursor-pointer"
              title={admin?.name || 'Admin'}
            >
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col bg-slate-900 text-white relative flex-shrink-0 h-screen sticky top-0
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        <SidebarContent />
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 bg-slate-700 hover:bg-slate-600 text-white p-1.5 rounded-full shadow-lg transition-colors z-10"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center gap-4 flex-shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600" />
            <span className="font-semibold text-gray-900">Light of India</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
