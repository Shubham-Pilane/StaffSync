import React, { useState, useEffect } from 'react';
import { Hourglass, ClipboardCheck, Check, X, Users } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

const ManagerDashboard = () => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const lr = await api.get('/leaves/pending');
      const tr = await api.get('/timesheets/pending');
      setPendingLeaves(lr.data);
      setPendingTimesheets(tr.data);
    } catch (err) { console.error(err); }
  };

  const handleAction = async (type, id, status) => {
    try {
      const endpoint = type === 'leave' ? `/leaves/${id}` : `/timesheets/${id}`;
      await api.patch(endpoint, { status });
      setNotification({ message: `${type === 'leave' ? 'Leave' : 'Timesheet'} ${status} successfully!`, type: 'success' });
      fetchApprovals();
    } catch (err) { 
      setNotification({ message: 'Action failed', type: 'error' });
    }
  };

  return (
    <div>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Management Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Hourglass size={20} color="var(--warning)" /> Leave Requests
            </h3>
            <span className="badge badge-warning">{pendingLeaves.length} Pending</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingLeaves.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No pending leave requests.</p>}
            {pendingLeaves.map(leave => (
              <ApprovalCard 
                key={leave.id} 
                title={leave.User?.name} 
                subtitle={`${leave.type} (${leave.startDate} to ${leave.endDate})`}
                onApprove={() => handleAction('leave', leave.id, 'approved')}
                onReject={() => handleAction('leave', leave.id, 'rejected')}
              />
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <ClipboardCheck size={20} color="var(--primary)" /> Timesheets
            </h3>
            <span className="badge badge-warning">{pendingTimesheets.length} Pending</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingTimesheets.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No pending timesheets.</p>}
            {pendingTimesheets.map(ts => (
              <ApprovalCard 
                key={ts.id} 
                title={ts.User?.name} 
                subtitle={`${ts.date}: ${ts.totalHours} hrs - ${ts.description}`}
                onApprove={() => handleAction('timesheet', ts.id, 'approved')}
                onReject={() => handleAction('timesheet', ts.id, 'rejected')}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>My Team Performance</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Visual metrics coming soon...</p>
      </div>
    </div>
  );
};

const ApprovalCard = ({ title, subtitle, onApprove, onReject }) => (
  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={onApprove} className="btn badge-success" style={{ padding: '0.5rem' }}><Check size={16} /></button>
        <button onClick={onReject} className="btn badge-error" style={{ padding: '0.5rem' }}><X size={16} /></button>
      </div>
    </div>
  </div>
);

export default ManagerDashboard;
