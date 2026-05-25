import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import useActivityTracker from '../hooks/useActivityTracker';
import { Navigate } from 'react-router-dom';
import { Menu, Briefcase } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useActivityTracker(user);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 600, color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.35rem', borderRadius: '6px', display: 'flex' }}>
            <Briefcase size={16} color="white" />
          </div>
          StaffSync
        </div>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          background: 'var(--primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontWeight: 700, 
          fontSize: '0.85rem'
        }}>
          {user?.name?.charAt(0)}
        </div>
      </div>

      {/* Sidebar Backdrop Overlay */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Navigation Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="animate-fade">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
