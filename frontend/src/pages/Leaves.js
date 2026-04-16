import React, { useState, useEffect } from 'react';
import { 
  Plus, Sun, Stethoscope, Coffee, Calendar, Clock, 
  CheckCircle, XCircle, AlertCircle, ChevronRight, X,
  Send, FileText, TrendingUp
} from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

const LEAVE_TYPES = [
  { label: 'Annual Leave', value: 'Annual', icon: Sun, color: '#f59e0b', bg: '#fef3c7', total: 18 },
  { label: 'Sick Leave', value: 'Sick', icon: Stethoscope, color: '#ef4444', bg: '#fee2e2', total: 12 },
  { label: 'Casual Leave', value: 'Casual', icon: Coffee, color: '#8b5cf6', bg: '#ede9fe', total: 6 },
];

const statusConfig = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: '#fef3c7', icon: AlertCircle },
  approved: { label: 'Approved', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fee2e2', icon: XCircle },
};

const Leaves = () => {
  const [leaves, setLeaves]           = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [formData, setFormData]       = useState({
    type: 'Annual', startDate: '', endDate: '', reason: ''
  });

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves/my');
      setLeaves(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  // Calculate used days per type
  const getUsedDays = (type) => {
    return leaves
      .filter(l => l.type === type && l.status === 'approved')
      .reduce((acc, l) => {
        const start = new Date(l.startDate);
        const end   = new Date(l.endDate);
        return acc + Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);
  };

  const getDuration = (l) => {
    const start = new Date(l.startDate);
    const end   = new Date(l.endDate);
    const days  = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days === 1 ? '1 day' : `${days} days`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      setNotification({ message: 'Please fill all fields.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/leaves', formData);
      setShowModal(false);
      setFormData({ type: 'Annual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
      setNotification({ message: 'Leave request submitted successfully!', type: 'success' });
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Request failed. Please try again.', type: 'error' });
    } finally { setLoading(false); }
  };

  const filtered = activeFilter === 'all'
    ? leaves
    : leaves.filter(l => l.status === activeFilter);

  const pendingCount = leaves.filter(l => l.status === 'pending').length;

  return (
    <div style={{ maxWidth: '1100px' }}>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Leave Management
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Track your leave balance, apply for time off, and view request status.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700 }}
        >
          <Plus size={18} /> Apply for Leave
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {LEAVE_TYPES.map(({ label, value, icon: Icon, color, bg, total }) => {
          const used      = getUsedDays(value);
          const remaining = total - used;
          const pct       = Math.min((used / total) * 100, 100);
          return (
            <div key={value} className="card" style={{ padding: '1.75rem', border: `1px solid ${color}22` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ background: bg, color, width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color, background: bg, padding: '0.25rem 0.75rem', borderRadius: '100px' }}>
                  {remaining} left
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.75rem', color: '#0f172a', lineHeight: 1 }}>{remaining}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' }}>{label}</div>
              {/* Progress bar */}
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '100px', transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                <span>{used} used</span>
                <span>{total} total</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* History Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Card Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={20} color="#4f46e5" />
            <h2 style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>Leave History</h2>
            {pendingCount > 0 && (
              <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '100px' }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '100px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'capitalize',
                  background: activeFilter === f ? '#4f46e5' : '#f8fafc',
                  color: activeFilter === f ? 'white' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Leave Cards List */}
        <div style={{ padding: '1rem 1.5rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
              <Calendar size={52} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>No leave requests found</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Click "Apply for Leave" to submit your first request.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
              {filtered.map(leave => {
                const StatusIcon = statusConfig[leave.status]?.icon || AlertCircle;
                const sColor     = statusConfig[leave.status]?.color || '#94a3b8';
                const sBg        = statusConfig[leave.status]?.bg    || '#f8fafc';
                const typeInfo   = LEAVE_TYPES.find(t => t.value === leave.type) || LEAVE_TYPES[0];
                const TypeIcon   = typeInfo.icon;

                return (
                  <div key={leave.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr auto',
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '1.25rem 1rem',
                    borderRadius: '16px',
                    border: '1px solid #f1f5f9',
                    background: '#fff',
                    transition: 'box-shadow 0.15s ease',
                  }}>
                    {/* Type icon */}
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: typeInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TypeIcon size={20} color={typeInfo.color} />
                    </div>

                    {/* Details */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{leave.type} Leave</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: typeInfo.color, background: typeInfo.bg, padding: '0.15rem 0.6rem', borderRadius: '100px' }}>
                          {getDuration(leave)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        <Calendar size={13} />
                        {new Date(leave.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {' – '}
                        {new Date(leave.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {leave.reason && (
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>
                          "{leave.reason}"
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: sBg, color: sColor, padding: '0.4rem 0.85rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.78rem' }}>
                        <StatusIcon size={13} />
                        {statusConfig[leave.status]?.label}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {new Date(leave.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="animate-fade" style={{
            background: 'white', borderRadius: '24px', padding: '2.5rem',
            width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f172a' }}>Apply for Leave</h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Submit a request to your manager for approval.</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Leave Type Selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Leave Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {LEAVE_TYPES.map(({ label, value, icon: Icon, color, bg }) => {
                    const used      = getUsedDays(value);
                    const remaining = LEAVE_TYPES.find(t => t.value === value)?.total - used;
                    const selected  = formData.type === value;
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setFormData({ ...formData, type: value })}
                        style={{
                          padding: '1rem 0.75rem',
                          borderRadius: '14px',
                          border: selected ? `2px solid ${color}` : '2px solid #f1f5f9',
                          background: selected ? bg : '#f8fafc',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ color, marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                          <Icon size={20} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{label.split(' ')[0]}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{remaining} left</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                    From
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', outline: 'none', background: 'white' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                    To
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', background: 'white' }}
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                  Reason for Leave
                </label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Briefly describe the reason for your leave request..."
                  style={{
                    width: '100%', padding: '0.85rem 1rem',
                    border: '1.5px solid #e2e8f0', borderRadius: '12px',
                    fontSize: '0.9rem', minHeight: '110px', resize: 'vertical',
                    fontFamily: 'inherit', lineHeight: 1.6, background: 'white'
                  }}
                  required
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center', borderRadius: '14px', padding: '1rem', fontWeight: 700 }}
                >
                  {loading ? 'Submitting...' : <><Send size={16} /> Submit Request</>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
