import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { to: '/admin/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/admin/categories', label: 'Categories', icon: 'M4 4h7a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm13 0h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V6a2 2 0 012-2zm0 9h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3a2 2 0 012-2z' },
  { to: '/admin/products/new', label: 'Add Product', icon: 'M12 4v16m8-8H4' },
  { to: '/admin/orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/admin/agents', label: 'Agents', icon: 'M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9a7 7 0 0114 0v1H5v-1z' },
  { to: '/admin/help-tickets', label: 'Help Tickets', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const [auditCount, setAuditCount] = useState(0);

  useEffect(() => {
    let timer;
    const isAdmin = user?.role === 'admin';
    if (!isAdmin) return undefined;

    const fetchCount = async () => {
      try {
        const lastSeen = window.localStorage.getItem('qd_admin_audit_last_seen');
        const params = lastSeen ? { fromDate: lastSeen } : {};
        const response = await adminService.getAuditLogCount(params);
        const total = response?.payload?.pagination?.total || 0;
        setAuditCount(total);
      } catch (error) {
        setAuditCount(0);
      }
    };

    fetchCount();
    timer = setInterval(fetchCount, 30000);
    return () => clearInterval(timer);
  }, [user?.role]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-blinkit-border h-[calc(100vh-56px)] sticky top-14 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-56'}`}>
        <div className="flex items-center justify-between px-3 py-3 border-b border-blinkit-border">
          {!collapsed && <span className="text-xs font-bold uppercase tracking-widest text-blinkit-gray">Admin</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-blinkit-gray hover:bg-blinkit-light-gray transition-colors ml-auto"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`admin-sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                </svg>
                {!collapsed && (
                  <span className="flex items-center gap-2">
                    {item.label}
                    {item.to === '/admin/audit-logs' && auditCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {auditCount > 99 ? '99+' : auditCount}
                      </span>
                    )}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-blinkit-border">
            <div className="bg-gradient-to-br from-blinkit-green to-blinkit-green-dark rounded-xl p-3">
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">QuickDROP</p>
              <p className="text-[10px] text-white/80 mt-0.5">Admin Panel v2.0</p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-blinkit-border glass flex items-center justify-around px-2 py-1.5">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${isActive ? 'text-blinkit-green' : 'text-blinkit-gray'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.2 : 1.6} d={item.icon} />
              </svg>
              <span className="text-[9px] font-semibold">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default AdminSidebar;
