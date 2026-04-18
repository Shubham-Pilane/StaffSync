import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Clock, AlertCircle, 
  Search, Filter, UserCheck, 
  Coffee, Moon, Bell, Calendar, Sparkles, Loader
} from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

const statusConfig = {
  active:     { label: 'Active',      color: '#10b981', bg: '#d1fae5', icon: UserCheck, desc: 'Currently working' },
  idle:       { label: 'Idle',        color: '#f59e0b', bg: '#fef3c7', icon: Coffee,    desc: 'Inactive for 5+ min' },
  away:       { label: 'Away',        color: '#ef4444', bg: '#fee2e2', icon: Moon,      desc: 'Inactive for 15+ min' },
  offline:    { label: 'Offline',     color: '#94a3b8', bg: '#f1f5f9', icon: Clock,     desc: 'Disconnected' },
  teaBreak:   { label: 'Tea Break',   color: '#8b5cf6', bg: '#ede9fe', icon: Coffee,    desc: 'Short break' },
  meeting:    { label: 'In Meeting',  color: '#06b6d4', bg: '#ecfeff', icon: Bell,      desc: 'Occupied' },
  lunchBreak: { label: 'Lunch Break', color: '#f97316', bg: '#fff7ed', icon: Coffee,    desc: 'Having food' },
  onLeave:    { label: 'On Leave',    color: '#3b82f6', bg: '#eff6ff', icon: Calendar,  desc: 'Not working today' },
};

const Tracking = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [aiModal, setAiModal] = useState({ show: false, content: '', loading: false, employeeName: '' });

  const fetchTeamStatus = async () => {
    try {
      const res = await api.get('/activity/team');
      setTeam(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamStatus();
    const interval = setInterval(fetchTeamStatus, 2000); 
    return () => clearInterval(interval);
  }, []);

  const handleGetInsights = async (employee) => {
    setAiModal({ show: true, content: '', loading: true, employeeName: employee.name });
    try {
      const res = await api.get(`/ai/employee/${employee.id}`);
      setAiModal(prev => ({ ...prev, content: res.data.insights, loading: false }));
    } catch (err) {
      setNotification({ message: 'AI failed to generate insights. Try again.', type: 'error' });
      setAiModal({ show: false, content: '', loading: false, employeeName: '' });
    }
  };

  const filteredTeam = team.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = Object.keys(statusConfig).reduce((acc, key) => {
    acc[key] = team.filter(m => m.status === key).length;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '1200px' }}>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}

      {/* Header & Stats Bundle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>
            Live Team Pulse
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.4rem', fontWeight: 500, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             Real-time activity tracking for your direct subordinates.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.5rem', background: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: '#4f46e5' }} />
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Managed</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{team.length}</span>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Staff</span>
          </div>
        </div>
        {Object.entries(statusConfig).filter(([k]) => k !== 'offline').map(([key, config]) => (
          <div key={key} className="card" style={{ padding: '1.5rem', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{config.label}</p>
              <div style={{ background: config.bg, color: config.color, width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <config.icon size={18} />
              </div>
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: config.color }}>{stats[key] || 0}</span>
          </div>
        ))}
      </div>

      {/* Team List Control */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name or department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
            <Bell size={18} />
            <span>Enable Idle Alerts</span>
            <div style={{ width: '40px', height: '20px', background: '#4f46e5', borderRadius: '20px', position: 'relative', cursor: 'pointer' }}>
              <div style={{ width: '14px', height: '14px', background: '#fff', borderRadius: '50%', position: 'absolute', right: '3px', top: '3px' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem' }}>
          {filteredTeam.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <Users size={48} color="#e2e8f0" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#94a3b8', fontWeight: 600 }}>No members found matches your criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {filteredTeam.map(member => {
                const config = statusConfig[member.status] || statusConfig.offline;
                const lastSeen = new Date(member.lastActivityAt);
                
                return (
                  <div key={member.id} style={{ 
                    padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9', background: '#fff',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                          <Users size={24} color="#64748b" />
                        </div>
                        <div style={{ 
                          position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', 
                          borderRadius: '50%', background: config.color, border: '3px solid #fff' 
                        }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{member.department}</p>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Status</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: config.color, fontWeight: 800, fontSize: '0.8rem' }}>
                          <config.icon size={14} />
                          {config.label}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Last Active</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                          {member.status === 'active' ? 'Right now' : lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {member.status === 'away' && (
                      <div style={{ marginTop: '1rem', background: '#fee2e2', padding: '0.6rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                        <AlertCircle size={14} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Inactive for 15+ minutes</span>
                      </div>
                    )}

                    <button 
                      onClick={() => handleGetInsights(member)}
                      style={{ 
                        marginTop: '1.25rem', 
                        width: '100%', 
                        fontSize: '0.75rem', 
                        padding: '0.75rem',
                        borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.6rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={16} /> AI Activity Insights
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {aiModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', 
          backdropFilter: 'blur(8px)', 
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card shadow-2xl animate-fade" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', background: '#fff', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f0f9ff', color: '#0369a1', padding: '0.75rem', borderRadius: '12px' }}>
                <Sparkles size={24} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>AI Performance Insights</h2>
            </div>
            
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              Recent activity analysis for <span style={{ color: '#0f172a', fontWeight: 800 }}>{aiModal.employeeName}</span>...
            </p>

            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '16px', 
              padding: '1.5rem', 
              minHeight: '200px',
              border: '1px solid #e2e8f0',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {aiModal.loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', marginTop: '2rem' }}>
                  <Loader className="animate-spin" size={32} color="#0369a1" />
                  <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9rem' }}>Gemini is analyzing data patterns...</span>
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155', fontSize: '0.95rem' }}>
                  {aiModal.content.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                    part.startsWith('**') && part.endsWith('**') 
                      ? <strong key={i} style={{ color: '#0f172a', fontWeight: 900 }}>{part.slice(2, -2)}</strong> 
                      : part
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={() => setAiModal({ show: false, content: '', loading: false, employeeName: '' })}
              style={{ 
                width: '100%', marginTop: '2rem', borderRadius: '12px', padding: '1rem',
                background: '#0f172a', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer'
              }}
            >
              Close Insights
            </button>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade { animation: fadeIn 0.3s ease-out; }
      `}} />
    </div>
  );
};

export default Tracking;
