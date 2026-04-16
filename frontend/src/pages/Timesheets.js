import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Send, Plus, X, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

const Timesheets = () => {
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

  const fetchTimesheets = async () => {
    try {
      const res = await api.get('/timesheets/my');
      setTimesheets(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTimesheets(); }, []);

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

  const statusColor = { approved: '#10b981', pending: '#f59e0b', rejected: '#ef4444' };

  return (
    <div style={{ maxWidth: '1200px' }}>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>My Timesheets</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>Track your daily hours — hover any date to log time.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => openModal(todayStr)}
            className="btn btn-primary"
            style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700 }}
          >
            <Plus size={18} /> Log Time
          </button>
          <button
            className="btn"
            style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#1e293b', border: 'none', fontWeight: 700 }}
          >
            <Send size={18} /> Submit for Approval
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <SummaryCard label="Total Hours This Month" value={`${totalHrs.toFixed(1)} hrs`} color="#4f46e5" icon={<Clock size={20} />} />
        <SummaryCard label="Approved"  value={`${approvedHrs.toFixed(1)} hrs`} color="#10b981" icon={<CheckCircle size={20} />} />
        <SummaryCard label="Pending Approval" value={`${pendingHrs.toFixed(1)} hrs`} color="#f59e0b" icon={<AlertCircle size={20} />} />
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>

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
                      color: !cell.current ? '#cbd5e1' : isToday ? '#4f46e5' : isWeekend ? '#94a3b8' : '#1e293b',
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
                      background: log.status === 'approved' ? '#d1fae5' : log.status === 'rejected' ? '#fee2e2' : '#ede9fe',
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

        {/* ── Right panel: Recent logs ──────────────────────────── */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                      onChange={e => setNewLog({ ...newLog, projectName: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="General">General</option>
                      <option value="Internal">Internal</option>
                      <option value="Client Project">Client Project</option>
                      <option value="R&D">R&D</option>
                    </select>
                  </div>

                  {/* Job Name */}
                  <div style={rowStyle}>
                    <label style={labelStyle}>
                      Job Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      style={inputStyle}
                      value={newLog.jobName}
                      onChange={e => setNewLog({ ...newLog, jobName: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Testing">Testing</option>
                      <option value="Meetings">Meetings</option>
                      <option value="Support">Support</option>
                      <option value="Documentation">Documentation</option>
                    </select>
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
