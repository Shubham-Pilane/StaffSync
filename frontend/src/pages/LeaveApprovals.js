import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Calendar, Clock, User, Filter } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

const statusConfig = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: '#fef3c7', icon: AlertCircle },
  approved: { label: 'Approved', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fee2e2', icon: XCircle },
};

const typeColors = {
  Annual:  { color: '#f59e0b', bg: '#fef3c7' },
  Sick:    { color: '#ef4444', bg: '#fee2e2' },
  Casual:  { color: '#8b5cf6', bg: '#ede9fe' },
};

const LeaveApprovals = () => {
  const [leaves, setLeaves]             = useState([]);
  const [filter, setFilter]             = useState('pending');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading]           = useState({});

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves/pending');
      setLeaves(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleAction = async (id, status) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      await api.patch(`/leaves/${id}`, { status });
      fetchLeaves();
      setNotification({
        message: `Leave ${status === 'approved' ? 'approved ✓' : 'rejected ✗'} successfully.`,
        type: status === 'approved' ? 'success' : 'error'
      });
    } catch (err) {
      setNotification({ message: 'Action failed. Please try again.', type: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const getDuration = (l) => {
    const start = new Date(l.startDate);
    const end   = new Date(l.endDate);
    const days  = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days === 1 ? '1 day' : `${days} days`;
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);
  const pendingCount = leaves.filter(l => l.status === 'pending').length;

  return (
    <div style={{ maxWidth: '900px' }}>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Leave Approvals
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
          Review and act on leave requests from your team members.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Awaiting Action', value: leaves.filter(l => l.status === 'pending').length,  color: '#f59e0b' },
          { label: 'Approved',        value: leaves.filter(l => l.status === 'approved').length, color: '#10b981' },
          { label: 'Rejected',        value: leaves.filter(l => l.status === 'rejected').length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1.2, marginTop: '0.25rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter + list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Card header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={18} color="#4f46e5" />
            <span style={{ fontWeight: 800, color: '#1e293b' }}>All Requests</span>
            {pendingCount > 0 && (
              <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '100px' }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: '100px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.75rem', textTransform: 'capitalize',
                  background: filter === f ? '#4f46e5' : '#f8fafc',
                  color: filter === f ? 'white' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Leave request list */}
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
              <CheckCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>
                {filter === 'pending' ? 'No pending requests — all caught up!' : 'No requests found.'}
              </p>
            </div>
          ) : filtered.map(leave => {
            const typeInfo = typeColors[leave.type] || typeColors.Annual;
            const StatusIcon = statusConfig[leave.status]?.icon || AlertCircle;
            const sColor = statusConfig[leave.status]?.color;
            const sBg    = statusConfig[leave.status]?.bg;
            const isPending = leave.status === 'pending';

            return (
              <div key={leave.id} style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                padding: '1.25rem', borderRadius: '16px',
                border: isPending ? '1px solid #fde68a' : '1px solid #f1f5f9',
                background: isPending ? '#fffbeb' : 'white',
                transition: 'all 0.15s'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                  background: typeInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <User size={22} color={typeInfo.color} />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>
                      {leave.User?.name || 'Employee'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: typeInfo.color, background: typeInfo.bg, padding: '0.15rem 0.6rem', borderRadius: '100px' }}>
                      {leave.type} Leave
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.6rem', borderRadius: '100px' }}>
                      {getDuration(leave)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    <Calendar size={13} />
                    {new Date(leave.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {' – '}
                    {new Date(leave.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {leave.reason && (
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, fontStyle: 'italic' }}>
                      "{leave.reason}"
                    </p>
                  )}
                </div>

                {/* Status or action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleAction(leave.id, 'approved')}
                        disabled={loading[leave.id]}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none',
                          background: '#d1fae5', color: '#065f46', cursor: 'pointer',
                          fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.15s',
                          opacity: loading[leave.id] ? 0.6 : 1
                        }}
                      >
                        <CheckCircle size={15} /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(leave.id, 'rejected')}
                        disabled={loading[leave.id]}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none',
                          background: '#fee2e2', color: '#991b1b', cursor: 'pointer',
                          fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.15s',
                          opacity: loading[leave.id] ? 0.6 : 1
                        }}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: sBg, color: sColor, padding: '0.45rem 0.9rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.78rem' }}>
                      <StatusIcon size={14} />
                      {statusConfig[leave.status]?.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeaveApprovals;
