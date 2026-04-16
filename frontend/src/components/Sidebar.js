import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, Calendar, ClipboardCheck, 
  Hourglass, LogOut, Settings, UserCircle, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = {
    SuperAdmin: [
      { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { path: '/companies', icon: <Building2 size={20} />, label: 'Companies' },
      { path: '/analytics', icon: <Briefcase size={20} />, label: 'Analytics' },
    ],
    HR: [
      { path: '/dashboard',          icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { path: '/employees',          icon: <Users size={20} />,           label: 'Employees' },
      { path: '/attendance',         icon: <Calendar size={20} />,        label: 'Attendance' },
      { path: '/leaves',             icon: <Hourglass size={20} />,       label: 'My Leaves' },
      { path: '/timesheets',         icon: <ClipboardCheck size={20} />,  label: 'Timesheets' },
      { path: '/attendance-reports', icon: <ClipboardCheck size={20} />,  label: 'Attendance Reports' },
      { path: '/leave-reports',      icon: <Hourglass size={20} />,       label: 'Leave Reports' },
    ],
    Manager: [
      { path: '/dashboard',              icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { path: '/attendance',             icon: <Calendar size={20} />,        label: 'Attendance' },
      { path: '/leaves',                 icon: <Hourglass size={20} />,       label: 'My Leaves' },
      { path: '/timesheets',             icon: <ClipboardCheck size={20} />,  label: 'Timesheets' },
      { path: '/employees',              icon: <Users size={20} />,           label: 'My Team' },
      { path: '/approvals/leaves',       icon: <Hourglass size={20} />,       label: 'Leave Approvals' },
      { path: '/approvals/timesheets',   icon: <ClipboardCheck size={20} />,  label: 'Timesheet Approvals' },
    ],
    Employee: [
      { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { path: '/attendance', icon: <Calendar size={20} />, label: 'Daily Attendance' },
      { path: '/leaves', icon: <Hourglass size={20} />, label: 'My Leaves' },
      { path: '/timesheets', icon: <ClipboardCheck size={20} />, label: 'Timesheets' },
    ]
  };

  const currentMenu = menuItems[user?.role] || [];

  return (
    <div className="sidebar" style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: '#0f172a',
      position: 'fixed',
      top: 0,
      left: 0,
      padding: '2rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      borderRight: '1px solid #1e293b'
    }}>
      <div className="logo" style={{ 
        fontSize: '1.25rem', 
        fontWeight: 800, 
        color: 'white',
        letterSpacing: '-0.02em',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ 
          background: 'var(--primary)', 
          padding: '0.5rem', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)'
        }}>
          <Briefcase size={20} color="white" strokeWidth={3} />
        </div>
        StaffSync
      </div>

      <nav style={{ flex: 1 }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.75rem' }}>Main Menu</p>
        {currentMenu.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `btn btn-ghost ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              width: '100%',
              justifyContent: 'flex-start',
              marginBottom: '0.25rem',
              padding: '0.75rem 0.875rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              gap: '0.875rem',
              color: isActive ? 'white' : '#94a3b8',
              background: isActive ? '#1e293b' : 'transparent',
              border: isActive ? '1px solid #334155' : '1px solid transparent'
            })}
          >
            {React.cloneElement(item.icon, { size: 18, strokeWidth: 2.5 })}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid #1e293b', paddingTop: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          padding: '0.5rem'
        }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: 'white',
            fontSize: '0.9rem'
          }}>
            {user?.name?.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{user?.role}</div>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="btn btn-ghost"
          style={{ 
            width: '100%', 
            justifyContent: 'flex-start', 
            color: '#f87171',
            padding: '0.75rem',
            background: 'rgba(248, 113, 113, 0.03)',
            border: '1px solid transparent'
          }}
        >
          <LogOut size={16} strokeWidth={2.5} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
