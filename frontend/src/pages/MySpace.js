import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Clock, Calendar, Users, FileText, 
  MapPin, CheckCircle, Smile, Bell, Search, PlusCircle,
  MoreHorizontal, ChevronRight, Play, Square, UserCheck, MessageSquare, Coffee
} from 'lucide-react';
import Attendance from './Attendance';
import Timesheets from './Timesheets';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const MySpace = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeSubTab, setActiveSubTab] = useState('Activities');
  const [activeTopTab, setActiveTopTab] = useState('My Space');
  const topTabs = ['My Space', 'Team', 'Organization'];
  const subTabs = ['Overview', 'Dashboard', 'Calendar'];
  const functionalTabs = ['Activities', 'Feeds', 'Profile', 'Approvals', 'Attendance', 'Time Logs', 'Timesheets', 'Jobs', 'Related Data'];

  const [activeAttendance, setActiveAttendance] = useState(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [manager, setManager] = useState(null);
  const [team, setTeam] = useState([]);
  const [notification, setNotification] = useState(null);
  const [currentUser, setCurrentUser] = useState(user);

  const refreshAllData = async () => {
    try {
      // 1. Get latest profile (includes Manager)
      const profileRes = await api.get('/profile');
      const freshUser = profileRes.data;
      setCurrentUser(freshUser);
      
      if (freshUser.Manager) {
        setManager(freshUser.Manager);
      }

      // 2. Get teammates
      const teamRes = await api.get('/employees');
      const userDept = freshUser.department?.toLowerCase()?.trim();
      const myTeammates = teamRes.data.filter(emp => 
        emp.department?.toLowerCase()?.trim() === userDept && 
        String(emp.id) !== String(freshUser.id)
      );
      setTeam(myTeammates);
      
      // 3. Get Attendance History
      const attRes = await api.get('/attendance/history');
      setAttendanceHistory(attRes.data);
      const active = attRes.data.find(a => !a.checkOut);
      setActiveAttendance(active);

    } catch (err) { console.error('Data loading error:', err); }
  };

  useEffect(() => {
    refreshAllData();
    // Refresh every 30 seconds to keep manager status/team status live
    const interval = setInterval(refreshAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const [attendanceHistory, setAttendanceHistory] = useState([]);


  useEffect(() => {
    let timer;
    
    timer = setInterval(() => {
      const now = new Date();
      
      // Calculate start of current 10 AM cycle
      const cycleStart = new Date(now);
      cycleStart.setHours(10, 0, 0, 0);
      if (now < cycleStart) {
        cycleStart.setDate(cycleStart.getDate() - 1);
      }

      let totalMs = 0;

      // Sum up completed sessions within the cycle
      attendanceHistory.forEach(session => {
        const checkIn = new Date(session.checkIn);
        const checkOut = session.checkOut ? new Date(session.checkOut) : now;
        
        // Skip sessions entirely before this cycle
        if (checkOut < cycleStart) return;

        // Clip the start to 10 AM if the session started earlier
        const effectiveStart = checkIn < cycleStart ? cycleStart : checkIn;
        
        // Sum the duration
        if (checkOut > effectiveStart) {
          totalMs += (checkOut - effectiveStart);
        }
      });

      const diff = Math.floor(totalMs / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [attendanceHistory, activeAttendance]);

  return (
    <div style={{ marginLeft: '-2rem', marginTop: '-2rem', width: 'calc(100% + 4rem)', minHeight: '100vh', background: '#f8fafc' }}>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      {/* Top Header */}
      <div style={{ background: '#0f172a', color: 'white', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {topTabs.map(tab => (
            <div 
              key={tab} 
              onClick={() => setActiveTopTab(tab)}
              style={{ 
                cursor: 'pointer', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                color: activeTopTab === tab ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                padding: '0.5rem 0',
                borderBottom: activeTopTab === tab ? '3px solid #38bdf8' : '3px solid transparent'
              }}
            >
              {tab}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <PlusCircle size={20} style={{ color: '#38bdf8' }} />
          <Search size={20} />
          <Bell size={20} />
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: 'white' }}>
            {user?.name?.charAt(0)}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '0 2rem', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {subTabs.map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                cursor: 'pointer', 
                padding: '1rem 0',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: activeTab === tab ? 'var(--primary)' : '#475569',
                borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent'
              }}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: '180px', width: '100%', background: 'url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2070") center/cover no-repeat', filter: 'brightness(0.8)' }}></div>

      <div style={{ display: 'flex', padding: '0 2rem', marginTop: '-60px', gap: '2rem', position: 'relative', zIndex: 10 }}>
        
        {/* Left Column */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="modal-solid" style={{ textAlign: 'center', padding: '2rem', background: 'white' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '24px', margin: '-4rem auto 1.5rem', overflow: 'hidden', border: '5px solid white', boxShadow: 'var(--shadow-lg)' }}>
              <img src={activeAttendance?.selfiePath ? `http://localhost:5000/${activeAttendance.selfiePath}` : `https://ui-avatars.com/api/?name=${user?.name}&background=8b5cf6&color=fff&size=200`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="profile" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{user?.role}</p>
            <span className="badge badge-warning" style={{ opacity: 0.8, marginBottom: '2.5rem' }}>Weekend</span>

            {!activeAttendance ? (
              <button 
                onClick={() => setActiveSubTab('Attendance')} 
                className="btn" 
                style={{ width: '100%', background: 'white', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '12px' }}
              >
                Go to Check-in
              </button>
            ) : (
              <button 
                onClick={() => setActiveSubTab('Attendance')} 
                className="btn" 
                style={{ width: '100%', background: 'white', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: '12px' }}
              >
                Go to Check-out
              </button>
            )}
          </div>

          {/* Manual Status Picker */}
          <div className="card" style={{ padding: '1.25rem', background: 'white' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Current Status</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { id: 'active', label: 'Active', icon: UserCheck, color: '#10b981', bg: '#d1fae5' },
                { id: 'teaBreak', label: 'Tea Break', icon: Coffee, color: '#8b5cf6', bg: '#ede9fe' },
                { id: 'lunchBreak', label: 'Lunch', icon: Coffee, color: '#f97316', bg: '#fff7ed' },
                { id: 'meeting', label: 'Meeting', icon: MessageSquare, color: '#06b6d4', bg: '#ecfeff' },
              ].map(st => {
                const isSelected = currentUser?.status === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={async () => {
                      try {
                        await api.post('/activity/heartbeat', { status: st.id });
                        setNotification({ message: `Status updated to ${st.label}`, type: 'success' });
                        
                        // 1. Update Global Auth State (Disables Tracker)
                        updateUser({ status: st.id });
                        
                        // 2. Update Local Dashboard Profile
                        setCurrentUser(prev => ({ ...prev, status: st.id }));
                      } catch (err) { 
                        setNotification({ message: 'Failed to update status', type: 'error' });
                      }
                    }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                      padding: '0.75rem 0.5rem', borderRadius: '12px', cursor: 'pointer',
                      border: isSelected ? `2px solid ${st.color}` : '2px solid #f1f5f9',
                      background: isSelected ? st.bg : '#fff',
                      transition: 'all 0.2s'
                    }}
                  >
                    <st.icon size={18} color={st.color} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isSelected ? st.color : '#64748b' }}>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: 'white' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>Reporting Manager</h4>
            {manager ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', overflow: 'hidden' }}>
                  <img src={`https://ui-avatars.com/api/?name=${manager.name}&background=random`} style={{ width: '100%', height: '100%' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{manager.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{manager.department || 'Management'}</div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No manager assigned</p>
            )}
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', background: 'white' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontWeight: 700 }}>Department Members</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {team.length > 0 ? team.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', overflow: 'hidden' }}>
                    <img src={`https://ui-avatars.com/api/?name=${member.name}&background=random`} style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{member.name}</div>
                </div>
              )) : (
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No teammates found</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '0 1rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                {functionalTabs.map(tab => (
                  <div 
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    style={{ 
                      cursor: 'pointer', 
                      padding: '1.25rem 0',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: activeSubTab === tab ? 'var(--primary)' : '#64748b',
                      borderBottom: activeSubTab === tab ? '3px solid var(--primary)' : '3px solid transparent'
                    }}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              <MoreHorizontal size={20} color="#94a3b8" />
            </div>
          </div>

          <div className="glass-card" style={{ minHeight: '400px', background: 'white', padding: '2rem' }}>
            {activeSubTab === 'Activities' && <ActivitiesView name={user?.name} />}
            {activeSubTab === 'Attendance' && <Attendance />}
            {activeSubTab === 'Timesheets' && <Timesheets />}
            {!['Activities', 'Attendance', 'Timesheets'].includes(activeSubTab) && (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <Smile size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#64748b' }}>The {activeSubTab} module is coming soon!</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivitiesView = ({ name }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <div style={{ padding: '1.5rem', background: 'linear-gradient(to right, #f8fafc, #ffffff)', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <img src="https://static.zohoave.com/people/static/images/profile-empty.svg" style={{ width: '60px' }} />
      <div>
        <h3 style={{ fontWeight: 800, color: '#1e293b' }}>Good Afternoon, {name}</h3>
        <p style={{ color: 'var(--text-muted)' }}>Have a productive day!</p>
      </div>
    </div>

    <div className="glass-card" style={{ background: '#f8fafc', border: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Clock size={20} color="var(--primary)" />
        <h4 style={{ fontWeight: 800, fontSize: '1rem' }}>Work Schedule</h4>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>06-Apr-2026 - 12-Apr-2026</p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {['Mon 06', 'Tue 07', 'Wed 08', 'Thu 09', 'Fri 10', 'Sat 11', 'Sun 12'].map(day => (
          <div key={day} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>{day}</div>
            <div style={{ fontSize: '0.7rem', color: day.includes('Sat') || day.includes('Sun') ? '#f59e0b' : 'var(--success)', fontWeight: 700 }}>
              {day.includes('Sat') || day.includes('Sun') ? 'Weekend' : 'Present'}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default MySpace;
