import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import useActivityTracker from '../hooks/useActivityTracker';
import { Navigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  useActivityTracker(user);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width)', 
        padding: '2rem',
        minHeight: '100vh',
        background: 'var(--bg-main)'
      }}>
        <div className="animate-fade">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
