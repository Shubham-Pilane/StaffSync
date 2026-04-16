import React, { useState, useEffect } from 'react';
import { Building2, Users, CreditCard, Activity, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../services/api';
import Toast from '../components/Toast';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    companies: 0,
    employees: 0,
    revenue: 0,
    activeUsers: 0
  });

  const chartData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 4500 },
    { name: 'May', revenue: 6000 },
  ];

  const [showModal, setShowModal] = useState(false);
  const [onboardData, setOnboardData] = useState({
    name: '', email: '', hrName: '', hrEmail: '', hrPassword: ''
  });
  const [notification, setNotification] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/companies');
      setStats({
        companies: res.data.length,
        employees: res.data.reduce((acc, c) => acc + (c.employeeCount || 0), 0),
        revenue: res.data.length * 99, // Dummy calculation
        activeUsers: Math.floor(res.data.length * 1.5)
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOnboard = async (e) => {
    e.preventDefault();
    try {
      await api.post('/companies', onboardData);
      setShowModal(false);
      fetchStats();
      setNotification({ message: 'Company onboarded successfully!', type: 'success' });
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to onboard company', type: 'error' });
    }
  };

  return (
    <div>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Platform Overview
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>System performance and growth analytics.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} strokeWidth={2.5} /> Onboard Company
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <StatCard icon={<Building2 />} label="Total Companies" value={stats.companies} color="#4f46e5" />
        <StatCard icon={<Users />} label="Total Employees" value={stats.employees} color="#10b981" />
        <StatCard icon={<CreditCard />} label="Annual Revenue" value={`$${stats.revenue.toLocaleString()}`} color="#f59e0b" />
        <StatCard icon={<Activity />} label="Active Users" value={stats.activeUsers} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>Revenue Performance</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Monthly revenue trend across all workspaces.</p>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>User Engagement</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Activity distribution by workspace.</p>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(v) => `$${v}`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 6, 6]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-solid animate-fade" style={{ width: '100%', maxWidth: '480px' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>Onboard Workspace</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontWeight: 500, fontSize: '0.9rem' }}>Initialize a new company tenant on the platform.</p>
            <form onSubmit={handleOnboard}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization</label>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <input className="input" placeholder="Company Name"
                    onChange={e => setOnboardData({...onboardData, name: e.target.value})} required />
                  <input type="email" className="input" placeholder="Corporate Email"
                    onChange={e => setOnboardData({...onboardData, email: e.target.value})} required />
                </div>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrator</label>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <input className="input" placeholder="Full Name"
                    onChange={e => setOnboardData({...onboardData, hrName: e.target.value})} required />
                  <input type="email" className="input" placeholder="Admin Email"
                    onChange={e => setOnboardData({...onboardData, hrEmail: e.target.value})} required />
                  <input type="password" className="input" placeholder="Temporary Password"
                    onChange={e => setOnboardData({...onboardData, hrPassword: e.target.value})} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>Create Workspace</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Dismiss</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <div style={{ 
      background: `${color}12`, 
      color: color, 
      padding: '0.75rem', 
      borderRadius: '10px'
    }}>
      {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
    </div>
    <div>
      <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{value}</div>
    </div>
  </div>
);

export default SuperAdminDashboard;
