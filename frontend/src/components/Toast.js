import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} color="#10b981" />,
    error: <XCircle size={20} color="#ef4444" />,
    info: <Info size={20} color="#6366f1" />
  };

  const bgColors = {
    success: '#ecfdf5',
    error: '#fef2f2',
    info: '#f5f3ff'
  };

  const borderColors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#6366f1'
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      background: bgColors[type],
      border: `1px solid ${borderColors[type]}`,
      padding: '1rem 1.25rem',
      borderRadius: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      zIndex: 2000,
      minWidth: '300px'
    }}>
      {icons[type]}
      <div style={{ flex: 1, color: '#1f2937', fontWeight: 600, fontSize: '0.875rem' }}>
        {message}
      </div>
      <button 
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
