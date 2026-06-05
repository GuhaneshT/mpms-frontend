import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRole, PERMISSIONS } from '../auth/permissions';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Settings, 
  LogOut, 
  Wrench,
  Menu,
  X,
  User,
  BookOpen
} from 'lucide-react';

export default function Layout({ children }) {
  const { signOut, can, role, displayName } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
    { name: 'Customers', path: '/customers', icon: Users, permission: PERMISSIONS.CUSTOMERS_READ },
    { name: 'Orders', path: '/orders', icon: Package, permission: PERMISSIONS.ORDERS_READ },
    { name: 'Machines', path: '/machines', icon: Settings, permission: PERMISSIONS.MACHINES_READ },
    { name: 'Service Calls', path: '/service-calls', icon: Wrench, permission: PERMISSIONS.SERVICE_CALLS_READ },
    { name: 'Knowledge Base', path: '/issues', icon: BookOpen, permission: PERMISSIONS.KNOWLEDGE_BASE_READ },
  ];
  const visibleNavItems = navItems.filter((item) => can(item.permission));

  const closeMobileMenu = () => setIsMobileOpen(false);

  return (
    <div className="app-layout">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'mobile-open' : ''}`} 
        onClick={closeMobileMenu}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>M-PMS Pro</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {formatRole(role)}
            </div>
          </div>
          <button className="mobile-menu-btn" onClick={closeMobileMenu}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/profile" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none' }}>
              <User size={18} />
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {displayName}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {formatRole(role)}
                </span>
              </span>
            </Link>
            <button onClick={signOut} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
