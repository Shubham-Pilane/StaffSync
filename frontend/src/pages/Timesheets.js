import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Send, Plus, X, FileText, TrendingUp, AlertCircle, Trash, Briefcase } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const Timesheets = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'projects'
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [timesheets, setTimesheets]     = useState([]);
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [hoveredDay, setHoveredDay]     = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [newLog, setNewLog]             = useState({
    date: '', projectName: '', jobName: '', workItem: '',
    description: '', hourMode: 'total', hours: '00:00',
    startTime: '', endTime: '', billableStatus: 'Billable'
  });
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', jobName: '', assignedEmployeeIds: [] });
  const [submittingProject, setSubmittingProject] = useState(false);

  const fetchTimesheets = async () => {
    try {
      const res = await api.get('/timesheets/my');
      setTimesheets(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTimesheets();
    fetchProjects();
    if (user?.role === 'Manager' || user?.role === 'HR') {
      fetchEmployees();
    }
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim() || !newProject.jobName.trim()) {
      setNotification({ message: 'Please fill out all fields.', type: 'error' });
      return;
    }
    setSubmittingProject(true);
    try {
      await api.post('/projects', newProject);
      setNewProject({ name: '', jobName: '', assignedEmployeeIds: [] });
      setShowProjectModal(false);
      fetchProjects();
      setNotification({ message: 'Project created successfully!', type: 'success' });
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to create project.', type: 'error' });
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
      setNotification({ message: 'Project deleted successfully!', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to delete project.', type: 'error' });
    }
  };

  // ── Calendar helpers ──────────────────────────────────────────
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert Sunday=0 to Mon-first grid offset
  const gridOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const formatDateKey = (d) =>
    `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const logsByDate = {};
  timesheets.forEach(t => {
    const key = t.date; // YYYY-MM-DD
    if (!logsByDate[key]) logsByDate[key] = [];
    logsByDate[key].push(t);
  });

  const openModal = (dateStr) => {
    setNewLog({
      date: dateStr, projectName: '', jobName: '', workItem: '',
      description: '', hourMode: 'total', hours: '00:00',
      startTime: '', endTime: '', billableStatus: 'Billable'
    });
    setShowModal(true);
  };

  const parseHHMM = (str) => {
    const [h, m] = (str || '00:00').split(':').map(Number);
    return parseFloat(((h || 0) + (m || 0) / 60).toFixed(2));
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    let totalHours = 0;
    if (newLog.hourMode === 'total') {
      totalHours = parseHHMM(newLog.hours);
    } else if (newLog.hourMode === 'range') {
      const start = parseHHMM(newLog.startTime);
      const end   = parseHHMM(newLog.endTime);
      totalHours = parseFloat((end - start).toFixed(2));
    }
    if (totalHours <= 0) {
      setNotification({ message: 'Please enter valid hours.', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/timesheets', {
        date:           newLog.date,
        totalHours,
        description:    newLog.description,
        projectName:    newLog.projectName,
        jobName:        newLog.jobName,
        workItem:       newLog.workItem,
        billableStatus: newLog.billableStatus,
        startTime:      newLog.startTime,
        endTime:        newLog.endTime,
      });
      setShowModal(false);
      fetchTimesheets();
      setNotification({ message: 'Time log saved!', type: 'success' });
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to save.', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const handleSubmitForApproval = async () => {
    const drafts = timesheets.filter(t => t.status === 'draft');
    if (drafts.length === 0) {
      setNotification({ message: 'No draft timesheets to submit.', type: 'info' });
      return;
    }

    setSubmittingApproval(true);
    try {
      await api.patch('/timesheets/submit');
      fetchTimesheets();
      setNotification({ message: 'Timesheets submitted for approval!', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to submit timesheets.', type: 'error' });
    } finally {
      setSubmittingApproval(false);
    }
  };

  // ── Summary totals ────────────────────────────────────────────
  const thisMonth = timesheets.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const totalHrs    = thisMonth.reduce((a, t) => a + (t.totalHours || 0), 0);
  const approvedHrs = thisMonth.filter(t => t.status === 'approved').reduce((a, t) => a + (t.totalHours || 0), 0);
  const pendingHrs  = thisMonth.filter(t => t.status === 'pending').reduce((a, t) => a + (t.totalHours || 0), 0);

  const formatMonth = (date) => date.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // ── Render ────────────────────────────────────────────────────
  const calCells = [];
  for (let i = 0; i < gridOffset; i++) {
    calCells.push({ day: daysInPrev - gridOffset + 1 + i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calCells.push({ day: d, current: true });
  }
  // Fill trailing cells to complete last row
  while (calCells.length % 7 !== 0) {
    calCells.push({ day: calCells.length - daysInMonth - gridOffset + 1, current: false });
  }

  const statusColor = { draft: '#94a3b8', approved: '#10b981', pending: '#f59e0b', rejected: '#ef4444' };

  return (
    <div style={{ maxWidth: '1200px' }}>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {activeTab === 'projects' ? 'Project Management' : 'My Timesheets'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            {activeTab === 'projects' ? 'Create projects, job names, and assign employee access rights.' : 'Track your daily hours — hover any date to log time.'}
          </p>
        </div>
        {activeTab === 'logs' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => openModal(todayStr)}
              className="btn btn-primary"
              style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700 }}
            >
              <Plus size={18} /> Log Time
            </button>
            <button
              onClick={handleSubmitForApproval}
              disabled={submittingApproval}
              className="btn"
              style={{ 
                borderRadius: '12px', 
                padding: '0.75rem 1.5rem', 
                background: '#f1f5f9', 
                color: '#1e293b', 
                border: 'none', 
                fontWeight: 700,
                opacity: submittingApproval ? 0.7 : 1,
                cursor: submittingApproval ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={18} /> {submittingApproval ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      {(user?.role === 'Manager' || user?.role === 'HR') && (
        <div className="card" style={{ padding: '0.5rem 1rem', background: 'white', marginBottom: '2rem', display: 'flex', gap: '1rem', overflowX: 'auto', border: '1px solid #f1f5f9' }}>
          <button 
            onClick={() => setActiveTab('logs')} 
            className="btn btn-ghost" 
            style={{ 
              padding: '0.5rem 1rem', 
              color: activeTab === 'logs' ? 'var(--primary)' : '#64748b',
              background: activeTab === 'logs' ? '#f5f3ff' : 'transparent',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            My Logs
          </button>
          <button 
            onClick={() => setActiveTab('projects')} 
            className="btn btn-ghost" 
            style={{ 
              padding: '0.5rem 1rem', 
              color: activeTab === 'projects' ? 'var(--primary)' : '#64748b',
              background: activeTab === 'projects' ? '#f5f3ff' : 'transparent',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            Manage Projects
          </button>
        </div>
      )}

      {activeTab === 'logs' && (
        <>

      {/* Summary cards */}
      <div className="grid-responsive-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <SummaryCard label="Total Hours This Month" value={`${totalHrs.toFixed(1)} hrs`} color="#4f46e5" icon={<Clock size={20} />} />
        <SummaryCard label="Approved"  value={`${approvedHrs.toFixed(1)} hrs`} color="#10b981" icon={<CheckCircle size={20} />} />
        <SummaryCard label="Pending Approval" value={`${pendingHrs.toFixed(1)} hrs`} color="#f59e0b" icon={<AlertCircle size={20} />} />
      </div>

      <div className="flex-responsive" style={{ gap: '2rem' }}>

        {/* ── Calendar ─────────────────────────────────────────── */}
        <div className="card" style={{ flex: 2, padding: '1.75rem' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{formatMonth(currentDate)}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <button onClick={prevMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', color: '#64748b', borderRadius: '8px' }}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem 0.75rem', fontWeight: 800, fontSize: '0.75rem', color: '#475569', borderRadius: '8px' }}>
                TODAY
              </button>
              <button onClick={nextMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', color: '#64748b', borderRadius: '8px' }}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Calendar responsive scroll container */}
          <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', overflowY: 'hidden' }}>
            <div style={{ minWidth: '700px' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', padding: '0.5rem 0', letterSpacing: '0.05em' }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {calCells.map((cell, i) => {
              const dateKey  = cell.current ? formatDateKey(cell.day) : null;
              const logs     = dateKey ? (logsByDate[dateKey] || []) : [];
              const isToday  = dateKey === todayStr;
              const isHover  = hoveredDay === i && cell.current;
              const isWeekend = (i % 7) >= 5; // Sat=5, Sun=6

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    background: !cell.current ? '#f8fafc' : isToday ? '#eef2ff' : isHover ? '#f8fafc' : 'white',
                    minHeight: '110px',
                    padding: '0.6rem',
                    position: 'relative',
                    cursor: cell.current ? 'default' : 'not-allowed',
                    transition: 'background 0.1s ease',
                    borderLeft: isToday ? '2px solid #4f46e5' : undefined,
                  }}
                >
                  {/* Day number */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem'
                  }}>
                    <span style={{
                      fontWeight: isToday ? 800 : 600,
                      fontSize: '0.85rem',
                      background: isToday ? '#4f46e5' : 'transparent',
                      color: isToday ? 'white' : !cell.current ? '#cbd5e1' : isWeekend ? '#94a3b8' : '#1e293b',
                      width: isToday ? '24px' : 'auto',
                      height: isToday ? '24px' : 'auto',
                      borderRadius: isToday ? '50%' : '0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {cell.day}
                    </span>

                    {/* Hover + button */}
                    {isHover && cell.current && (
                      <button
                        onClick={() => openModal(dateKey)}
                        title={`Log time for ${dateKey}`}
                        style={{
                          width: '22px', height: '22px',
                          borderRadius: '6px',
                          background: '#4f46e5',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white',
                          boxShadow: '0 2px 6px rgba(79,70,229,0.4)',
                          transition: 'all 0.15s ease',
                          flexShrink: 0
                        }}
                      >
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    )}
                  </div>

                  {/* Log chips */}
                  {logs.map((log, li) => (
                    <div key={li} style={{
                    background: log.status === 'approved' ? '#d1fae5' : log.status === 'rejected' ? '#fee2e2' : log.status === 'draft' ? '#f1f5f9' : '#ede9fe',
                      color: statusColor[log.status] || '#8b5cf6',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginBottom: '0.2rem'
                    }}>
                      <Clock size={10} />
                      {log.totalHours}h {log.description ? `· ${log.description.slice(0, 12)}${log.description.length > 12 ? '…' : ''}` : ''}
                    </div>
                  ))}
                </div>
              );
            })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: Recent logs ──────────────────────────── */}
        <div className="timesheets-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="#4f46e5" /> Recent Logs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {timesheets.slice(0, 10).length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No logs yet. Hover a date to add one!</p>
              ) : timesheets.slice(0, 10).map(t => (
                <div key={t.id} style={{
                  padding: '0.85rem 1rem', background: '#f8fafc',
                  borderRadius: '12px', borderLeft: `3px solid ${statusColor[t.status] || '#4f46e5'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>
                      {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontWeight: 800, color: '#4f46e5', fontSize: '0.9rem' }}>{t.totalHours}h</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{t.description || 'General Work'}</div>
                  {t.managerComment && (
                    <div style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600, marginTop: '0.4rem', background: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', borderLeft: '2px solid #cbd5e1' }}>
                      Manager: "{t.managerComment}"
                    </div>
                  )}
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700,
                      color: statusColor[t.status], background: `${statusColor[t.status]}20`,
                      padding: '0.15rem 0.5rem', borderRadius: '100px', textTransform: 'capitalize'
                    }}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      </>
      )}

      {/* TAB CONTENT: Manage Projects (Manager/HR only) */}
      {activeTab === 'projects' && (user?.role === 'Manager' || user?.role === 'HR') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          
          {/* Projects Directory Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={20} color="var(--primary)" /> Project Directory
              </h3>
              <button 
                onClick={() => {
                  setNewProject({ name: '', jobName: '', assignedEmployeeIds: [] });
                  setShowProjectModal(true);
                }} 
                className="btn btn-primary"
                style={{ borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}
              >
                <Plus size={16} /> New Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
                💼 No projects registered yet. Create one to assign to employees!
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Job Name</th>
                      <th>Assigned Team</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: '#1e293b' }}>{p.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.jobName || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {p.Employees && p.Employees.length > 0 ? (
                              p.Employees.map(emp => (
                                <span 
                                  key={emp.id} 
                                  style={{
                                    fontSize: '0.7rem', fontWeight: 700, background: '#f5f3ff', color: 'var(--primary)',
                                    padding: '0.15rem 0.5rem', borderRadius: '100px', border: '1px solid #ddd6fe'
                                  }}
                                >
                                  {emp.name}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontStyle: 'italic' }}>None</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button 
                              type="button"
                              onClick={() => handleDeleteProject(p.id)} 
                              className="btn btn-ghost" 
                              style={{ padding: '0.4rem', border: '1px solid var(--border)', color: 'var(--error)', borderRadius: '8px' }}
                              title="Delete Project"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="card" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b', marginBottom: '1.25rem' }}>
              Project Assignment Guide
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              As a **Manager** or **HR** administrator, you can easily control which employees can view and log hours for specific projects:
            </p>
            <ul style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, paddingLeft: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Dynamic Filtering:</strong> Employees will only see projects that are explicitly assigned to them in their Log Time project dropdown.</li>
              <li><strong>Pre-Populated Jobs:</strong> When an employee selects a project, the job name is auto-completed automatically, accelerating their daily timesheet flow.</li>
              <li><strong>Real-Time Allocation:</strong> Deleting a project instantly revokes log access for all users assigned to it.</li>
            </ul>
            <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #f59e0b', fontSize: '0.82rem', fontWeight: 600, color: '#b45309' }}>
              ⚠️ Note: Timesheets that were already submitted or approved for deleted projects will remain safely stored for auditing and report history.
            </div>
          </div>

        </div>
      )}

      {/* ── Add Project Modal ────────────────────────────────────── */}
      {showProjectModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="animate-fade" style={{
            background: 'white', borderRadius: '24px', padding: '2.5rem',
            width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f172a' }}>Create New Project</h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Define a project, job, and assign access rights to team members.</p>
              </div>
              <button onClick={() => setShowProjectModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              {/* Project Name */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                  Project Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Acme Redesign"
                  value={newProject.name}
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                  style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', outline: 'none', background: 'white' }}
                  required 
                />
              </div>

              {/* Job Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                  Job Name / Component <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Development"
                  value={newProject.jobName}
                  onChange={e => setNewProject({ ...newProject, jobName: e.target.value })}
                  style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', outline: 'none', background: 'white' }}
                  required 
                />
              </div>

              {/* Select Employees Checkbox List */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                  Assign Team Members
                </label>
                <div style={{ 
                  maxHeight: '160px', overflowY: 'auto', border: '1.5px solid #e2e8f0', 
                  borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc' 
                }}>
                  {employees.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>No employees found to assign.</span>
                  ) : (
                    employees.map(emp => {
                      const isChecked = newProject.assignedEmployeeIds.includes(emp.id);
                      return (
                        <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updatedIds = isChecked 
                                ? newProject.assignedEmployeeIds.filter(id => id !== emp.id)
                                : [...newProject.assignedEmployeeIds, emp.id];
                              setNewProject({ ...newProject, assignedEmployeeIds: updatedIds });
                            }}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                          />
                          {emp.name} ({emp.role})
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={submittingProject}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center', borderRadius: '14px', padding: '1rem', fontWeight: 700 }}
                >
                  {submittingProject ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Log Modal ─────────────────────────────────────────── */}
      {showModal && (() => {
        const d = newLog.date ? new Date(newLog.date + 'T12:00:00') : new Date();
        const dayNum = d.getDate();
        const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });

        const inputStyle = {
          width: '100%', padding: '0.6rem 0.85rem',
          border: '1px solid #d1d5db', borderRadius: '6px',
          fontSize: '0.9rem', background: 'white', outline: 'none',
          fontFamily: 'inherit'
        };
        const labelStyle = {
          fontSize: '0.875rem', color: '#374151', fontWeight: 500,
          whiteSpace: 'nowrap', paddingTop: '0.55rem', flexShrink: 0, width: '120px'
        };
        const rowStyle = {
          display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1rem'
        };

        return (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}>
            <div className="animate-fade" style={{
              background: 'white', borderRadius: '12px', overflow: 'hidden',
              width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}>
              {/* Grey header bar */}
              <div style={{
                background: '#f3f4f6', padding: '1rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>Log Time</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6b7280', fontSize: '0.9rem' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}></span>
                    {dayNum} {dayName}
                  </span>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: '#e5e7eb', border: 'none', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#6b7280" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmitLog}>
                <div style={{ padding: '1.5rem 2rem' }}>

                  {/* Project Name */}
                  <div style={rowStyle}>
                    <label style={labelStyle}>
                      Project Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      style={inputStyle}
                      value={newLog.projectName}
                      onChange={e => {
                        const val = e.target.value;
                        const proj = projects.find(p => p.name === val);
                        setNewLog({
                          ...newLog,
                          projectName: val,
                          jobName: proj ? (proj.jobName || '') : ''
                        });
                      }}
                      required
                    >
                      <option value="">Select</option>
                      {projects.length === 0 ? (
                        <option value="" disabled>No projects assigned. Contact Manager/HR.</option>
                      ) : (
                        projects.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Job Name */}
                  <div style={rowStyle}>
                    <label style={labelStyle}>
                      Job Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={newLog.jobName}
                      onChange={e => setNewLog({ ...newLog, jobName: e.target.value })}
                      placeholder="e.g. Development (Auto-filled by project)"
                      required
                    />
                  </div>

                  {/* Work Item */}
                  <div style={rowStyle}>
                    <label style={labelStyle}>Work Item</label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder=""
                      value={newLog.workItem}
                      onChange={e => setNewLog({ ...newLog, workItem: e.target.value })}
                    />
                  </div>

                  {/* Description */}
                  <div style={rowStyle}>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', lineHeight: 1.5 }}
                      value={newLog.description}
                      onChange={e => setNewLog({ ...newLog, description: e.target.value })}
                    />
                  </div>

                  {/* Hours — radio group */}
                  <div style={rowStyle}>
                    <label style={labelStyle}>
                      Hours <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ flex: 1 }}>
                      {/* Radio options */}
                      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                        {[
                          { val: 'total', label: 'Total hours' },
                          { val: 'range', label: 'Start and end time' },
                          { val: 'timer', label: 'Timer' },
                        ].map(opt => (
                          <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
                            <input
                              type="radio"
                              name="hourMode"
                              value={opt.val}
                              checked={newLog.hourMode === opt.val}
                              onChange={() => setNewLog({ ...newLog, hourMode: opt.val })}
                              style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>

                      {/* Total hours input — plain HH:MM, no AM/PM */}
                      {newLog.hourMode === 'total' && (() => {
                        const [hh, mm] = (newLog.hours || '00:00').split(':');
                        const numInput = {
                          width: '56px', padding: '0.55rem 0.5rem',
                          border: '1px solid #d1d5db', borderRadius: '6px',
                          fontSize: '1.1rem', fontWeight: 700, textAlign: 'center',
                          background: 'white', outline: 'none', fontFamily: 'monospace'
                        };
                        const setHH = (v) => {
                          const val = Math.max(0, Math.min(23, parseInt(v) || 0));
                          setNewLog({ ...newLog, hours: `${String(val).padStart(2,'0')}:${mm || '00'}` });
                        };
                        const setMM = (v) => {
                          const val = Math.max(0, Math.min(59, parseInt(v) || 0));
                          setNewLog({ ...newLog, hours: `${hh || '00'}:${String(val).padStart(2,'0')}` });
                        };
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="number" min="0" max="23"
                              value={parseInt(hh) || 0}
                              onChange={e => setHH(e.target.value)}
                              style={numInput}
                              autoFocus
                            />
                            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#374151' }}>:</span>
                            <input
                              type="number" min="0" max="59"
                              value={parseInt(mm) || 0}
                              onChange={e => setMM(e.target.value)}
                              style={numInput}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>hh&nbsp;&nbsp;mm</span>
                            <span style={{ color: '#f59e0b', fontSize: '1rem', lineHeight: 1 }}>ⓘ</span>
                          </div>
                        );
                      })()}


                      {/* Start and end time */}
                      {newLog.hourMode === 'range' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input type="time" value={newLog.startTime} onChange={e => setNewLog({ ...newLog, startTime: e.target.value })} style={{ ...inputStyle, width: '120px' }} required />
                          <span style={{ color: '#9ca3af' }}>to</span>
                          <input type="time" value={newLog.endTime}   onChange={e => setNewLog({ ...newLog, endTime: e.target.value })}   style={{ ...inputStyle, width: '120px' }} required />
                        </div>
                      )}

                      {/* Timer mode placeholder */}
                      {newLog.hourMode === 'timer' && (
                        <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>
                          ⏱ Timer mode — start the timer from the calendar view.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Billable Status */}
                  <div style={rowStyle}>
                    <label style={labelStyle}>Billable Status</label>
                    <select
                      style={inputStyle}
                      value={newLog.billableStatus}
                      onChange={e => setNewLog({ ...newLog, billableStatus: e.target.value })}
                    >
                      <option value="Billable">Billable</option>
                      <option value="Non-Billable">Non-Billable</option>
                    </select>
                  </div>
                </div>

                {/* Footer buttons */}
                <div style={{
                  padding: '1rem 2rem',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex', gap: '0.75rem'
                }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '0.6rem 1.75rem', borderRadius: '6px', border: 'none',
                      background: '#2563eb', color: 'white', fontWeight: 700,
                      fontSize: '0.9rem', cursor: 'pointer', opacity: submitting ? 0.7 : 1
                    }}
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '0.6rem 1.5rem', borderRadius: '6px',
                      border: '1px solid #d1d5db', background: 'white', color: '#374151',
                      fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

const SummaryCard = ({ label, value, color, icon }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}>
    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{value}</div>
    </div>
  </div>
);

export default Timesheets;
