import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Orders', path: '/orders', icon: Package },
    { name: 'Machines', path: '/machines', icon: Settings },
    { name: 'Service Calls', path: '/service-calls', icon: Wrench },
    { name: 'Knowledge Base', path: '/issues', icon: BookOpen },
  ];

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
          <span>M-PMS Pro</span>
          <button className="mobile-menu-btn" onClick={closeMobileMenu}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
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
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {user?.email?.split('@')[0] || 'Profile'}
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
