import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Calendar, Clock, 
  User, Filter, FileText, ChevronRight, X, Eye, 
  ArrowRight, Download
} from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

const statusConfig = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: '#fef3c7', icon: AlertCircle },
  approved: { label: 'Approved', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fee2e2', icon: XCircle },
};

const TimesheetApprovals = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [notification, setNotification] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [reviewBatch, setReviewBatch] = useState(null); // The employee's logs being reviewed
  const [batchComment, setBatchComment] = useState("");

  const fetchTimesheets = async () => {
    try {
      const res = await api.get('/timesheets/pending');
      setTimesheets(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTimesheets(); }, []);

  // Grouping logic: Group by User
  const grouped = timesheets.reduce((acc, ts) => {
    const userId = ts.userId;
    if (!acc[userId]) {
      acc[userId] = {
        user: ts.User,
        logs: [],
        totalHours: 0,
        pendingCount: 0,
        id: userId
      };
    }
    acc[userId].logs.push(ts);
    acc[userId].totalHours += ts.totalHours;
    if (ts.status === 'pending') acc[userId].pendingCount++;
    return acc;
  }, {});

  const groupsArray = Object.values(grouped).filter(g => {
    if (filter === 'all') return true;
    if (filter === 'pending') return g.pendingCount > 0;
    return g.logs.some(l => l.status === filter);
  });

  const handleBatchAction = async (status) => {
    if (!reviewBatch) return;
    const pendingIds = reviewBatch.logs.filter(l => l.status === 'pending').map(l => l.id);
    
    setLoadingAction(true);
    try {
      await api.patch('/timesheets/bulk-approval', {
        ids: pendingIds,
        status,
        managerComment: batchComment
      });
      setNotification({
        message: `Batch ${status} successfully for ${reviewBatch.user.name}`,
        type: status === 'approved' ? 'success' : 'error'
      });
      setReviewBatch(null);
      setBatchComment("");
      fetchTimesheets();
    } catch (err) {
      setNotification({ message: 'Action failed.', type: 'error' });
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>
          Timesheet Approvals
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.4rem', fontWeight: 500, fontSize: '1.05rem' }}>
          Review employee timesheet batches and verify billable hours.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
        {['pending', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.025em',
              background: filter === f ? '#4f46e5' : 'transparent',
              color: filter === f ? 'white' : '#64748b',
              boxShadow: filter === f ? '0 4px 12px rgba(79,70,229,0.2)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {f === 'pending' ? 'To Review' : 'All Batches'}
          </button>
        ))}
      </div>

      {/* Batch Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {groupsArray.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
            <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <CheckCircle size={32} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>All Clear!</h3>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>No timesheet batches awaiting review at this time.</p>
          </div>
        ) : groupsArray.map(batch => (
          <div key={batch.id} className="card animate-fade-in" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: batch.pendingCount > 0 ? '#fef3c7' : '#d1fae5', color: batch.pendingCount > 0 ? '#d97706' : '#059669', fontSize: '0.7rem', fontWeight: 900, borderBottomLeftRadius: '12px' }}>
              {batch.pendingCount > 0 ? `${batch.pendingCount} PENDING` : 'REVIEWED'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '56px', height: '56px', background: '#e0e7ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={28} color="#4f46e5" />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {batch.user.name}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>{batch.user.department || 'Employee'}</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Hours</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#4f46e5', margin: 0 }}>{batch.totalHours.toFixed(1)} <span style={{ fontSize: '0.85rem' }}>hrs</span></p>
              </div>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Entries</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{batch.logs.length}</p>
              </div>
            </div>

            <button 
              onClick={() => setReviewBatch(batch)}
              style={{
                width: '100%', padding: '0.9rem', borderRadius: '12px', 
                border: batch.pendingCount > 0 ? 'none' : '2px solid #e2e8f0',
                background: batch.pendingCount > 0 ? '#4f46e5' : '#fff',
                color: batch.pendingCount > 0 ? '#fff' : '#64748b',
                fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: batch.pendingCount > 0 ? '0 4px 14px rgba(79,70,229,0.3)' : 'none'
              }}
            >
              {batch.pendingCount > 0 ? <><Eye size={18} /> Review Batch</> : 'View History'}
            </button>
          </div>
        ))}
      </div>

      {/* ── Detailed Review Modal ─────────────────────────────────── */}
      {reviewBatch && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div className="animate-scale-in" style={{
            background: '#fff', borderRadius: '28px', width: '100%', maxWidth: '900px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', background: '#e0e7ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={24} color="#4f46e5" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Detailed Review</h2>
                  <p style={{ color: '#64748b', margin: 0, fontWeight: 500 }}>Reviewing logs for <strong>{reviewBatch.user.name}</strong></p>
                </div>
              </div>
              <button 
                onClick={() => { setReviewBatch(null); setBatchComment(""); }}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Table */}
            <div style={{ padding: '2rem 2.5rem', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0 1rem 0.75rem 0', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Date / Project</th>
                    <th style={{ textAlign: 'left', padding: '0 1rem 0.75rem 0', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '0 1rem 0.75rem 0', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Hours</th>
                    <th style={{ textAlign: 'center', padding: '0 0 0.75rem 0', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewBatch.logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ padding: '1.25rem 1rem', background: '#f8fafc', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>
                          {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FileText size={12} /> {log.projectName || 'Internal'}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', background: '#f8fafc', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                        {log.description || 'No description provided.'}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', background: '#f8fafc', textAlign: 'right', fontWeight: 900, color: '#1e293b' }}>
                        {log.totalHours.toFixed(1)}h
                      </td>
                      <td style={{ padding: '1.25rem 1rem', background: '#f8fafc', borderTopRightRadius: '16px', borderBottomRightRadius: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.3rem 0.75rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800,
                          background: statusConfig[log.status]?.bg, color: statusConfig[log.status]?.color,
                          textTransform: 'uppercase'
                        }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer - Actions */}
            <div style={{ padding: '2rem 2.5rem', borderTop: '1px solid #f1f5f9', background: '#fcfdfe' }}>
              {reviewBatch.pendingCount > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Batch Comment (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="Add a feedback message for the entire batch..."
                        value={batchComment}
                        onChange={(e) => setBatchComment(e.target.value)}
                        style={{ width: '100%', padding: '0.9rem 1.25rem', borderRadius: '12px', border: '1,5px solid #e2e8f0', outline: 'none', background: '#fff' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={() => handleBatchAction('approved')}
                      disabled={loadingAction}
                      style={{
                        flex: 1, padding: '1rem', borderRadius: '14px', border: 'none', background: '#10b981', color: '#fff',
                        fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        boxShadow: '0 10px 25px rgba(16,185,129,0.3)', transition: 'all 0.2s', opacity: loadingAction ? 0.7 : 1
                      }}
                    >
                      <CheckCircle size={22} /> Approve All Pending
                    </button>
                    <button 
                      onClick={() => handleBatchAction('rejected')}
                      disabled={loadingAction}
                      style={{
                        flex: 1, padding: '1rem', borderRadius: '14px', border: 'none', background: '#ef4444', color: '#fff',
                        fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        boxShadow: '0 10px 25px rgba(239,68,68,0.3)', transition: 'all 0.2s', opacity: loadingAction ? 0.7 : 1
                      }}
                    >
                      <XCircle size={22} /> Reject All Pending
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#94a3b8', fontWeight: 700 }}>This batch has already been processed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}} />
    </div>
  );
};

export default TimesheetApprovals;
