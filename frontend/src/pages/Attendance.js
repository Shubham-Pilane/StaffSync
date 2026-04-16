import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, MapPin, Play, Square, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const [activeAttendance, setActiveAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  
  const webcamRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/attendance/history');
      setHistory(res.data);
      const active = res.data.find(a => !a.checkOut);
      if (active) setActiveAttendance(active);
      else setActiveAttendance(null);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    let timer;
    if (activeAttendance) {
      timer = setInterval(() => {
        const start = new Date(activeAttendance.checkIn);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        const hrs = Math.floor(diff / 3600).toString().padStart(2, '0');
        const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        setElapsed(`${hrs}:${mins}:${secs}`);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeAttendance]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      // 1. Get screenshot
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error('Could not capture selfie');

      // 2. Get Location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const location = `${position.coords.latitude}, ${position.coords.longitude}`;

      // 3. Prepare FormData
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append('selfie', blob, 'selfie.jpg');
      formData.append('location', location);

      // 4. Send to API
      const res = await api.post('/attendance/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setActiveAttendance(res.data);
      setShowModal(false);
      fetchHistory();
      setNotification({ message: 'Checked in successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Verification failed. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/check-out');
      setActiveAttendance(null);
      fetchHistory();
      setNotification({ message: 'Checked out successfully!', type: 'success' });
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, #1e293b, #64748b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>
            Daily Attendance
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Log your hours with identity verification.</p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.2fr 1.8fr', 
        gap: '2rem', 
        marginBottom: '3rem',
        opacity: showModal ? 0 : 1,
        transition: 'opacity 0.2s ease',
        pointerEvents: showModal ? 'none' : 'auto'
      }}>
        {/* Check-in Card (as shown in user image) */}
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ 
            width: '140px', 
            height: '140px', 
            borderRadius: '24px', 
            margin: '0 auto 2rem',
            overflow: 'hidden',
            border: '4px solid white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {activeAttendance && activeAttendance.selfiePath ? (
              <img src={`http://localhost:5000/${activeAttendance.selfiePath}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={48} color="#94a3b8" />
              </div>
            )}
          </div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>{user?.name || 'Loading...'}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 600 }}>{user?.role}{user?.department ? ` · ${user.department}` : ''}</p>

          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            justifyContent: 'center', 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            fontFamily: 'monospace',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: '2.5rem',
            color: '#1e293b'
          }}>
            {elapsed.split(':').map((unit, i) => (
              <React.Fragment key={i}>
                <span style={{ 
                  background: '#f8fafc',
                  width: '72px',
                  height: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>{unit}</span>
                {i < 2 && <span style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center' }}>:</span>}
              </React.Fragment>
            ))}
          </div>

          {!activeAttendance ? (
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ width: '100%', borderRadius: '16px', padding: '1.25rem', fontSize: '1.1rem' }}>
              <Play size={20} /> Check-in
            </button>
          ) : (
            <button onClick={handleCheckOut} className="btn" style={{ width: '100%', borderRadius: '16px', padding: '1.25rem', fontSize: '1.1rem', background: '#fee2e2', color: '#ef4444', border: 'none' }}>
              <Square size={20} /> Check-out
            </button>
          )}
        </div>

        {/* History Card */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Activity Logs</h3>
            <span className="badge" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>Past 30 Days</span>
          </div>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600 }}>{new Date(record.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                    <td>{new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>
                      {record.checkOut ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle size={14} color="var(--success)" />
                          <span style={{ fontWeight: 700 }}>{record.totalHours ? `${record.totalHours} hrs` : '< 1 min'}</span>
                        </div>
                      ) : (
                        <span className="badge badge-warning">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', 
          backdropFilter: 'blur(12px)', 
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
          willChange: 'backdrop-filter, background-color',
          transform: 'translateZ(0)'
        }}>
          <div className="modal-solid animate-fade" style={{ 
            width: '100%', 
            maxWidth: '500px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transform: 'translateZ(0)'
          }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>Attendance Verification</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontWeight: 500 }}>Please ensure your face is clearly visible and location services are enabled.</p>
            
            <div style={{ 
              borderRadius: '24px', 
              overflow: 'hidden', 
              background: '#000', 
              marginBottom: '2rem',
              aspectRatio: '4/3',
              position: 'relative'
            }}>
              <Webcam 
                ref={webcamRef} 
                screenshotFormat="image/jpeg"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ 
                position: 'absolute', 
                bottom: '1rem', 
                left: '50%', 
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '100px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <MapPin size={14} /> Fetching GPS Location...
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <button 
                onClick={handleCheckIn} 
                disabled={loading}
                className="btn btn-primary" 
                style={{ flex: 1.5, justifyContent: 'center', borderRadius: '14px', padding: '1rem' }}
              >
                {loading ? 'Verifying...' : 'Capture & Check-in'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="btn btn-ghost" 
                style={{ flex: 1, justifyContent: 'center', borderRadius: '14px', background: '#f1f5f9', color: '#475569' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
