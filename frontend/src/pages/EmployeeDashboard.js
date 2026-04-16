import React, { useState, useEffect, useRef } from 'react';
import { Camera, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Webcam from 'react-webcam';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [timer, setTimer] = useState(0);
  const webcamRef = useRef(null);

  useEffect(() => {
    let interval;
    if (checkedIn) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [checkedIn]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAttendance = async () => {
    if (!checkedIn) {
      setCheckingIn(true);
    } else {
      try {
        await api.post('/attendance/check-out');
        setCheckedIn(false);
        setTimer(0);
        alert('Checked out successfully!');
      } catch (err) {
        alert(err.response?.data?.error || 'Check-out failed');
      }
    }
  };

  const captureAndCheckIn = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      // Convert base64 to file
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append('selfie', blob, 'selfie.jpg');

      await api.post('/attendance/check-in', formData);
      setCheckedIn(true);
      setCheckingIn(false);
      alert('Checked in successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Check-in failed');
    }
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Hello, {user?.name}!</h1>
        <p style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: checkedIn ? '#ecfdf5' : '#f8fafc', 
            border: `4px solid ${checkedIn ? 'var(--success)' : 'var(--border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: checkedIn ? 'var(--success)' : 'var(--text-muted)'
          }}>
            <Clock size={48} />
          </div>

          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace' }}>
              {formatTime(timer)}
            </div>
            <p style={{ color: 'var(--text-muted)' }}>Current Session Time</p>
          </div>

          <button 
            onClick={handleAttendance}
            className={`btn ${checkedIn ? 'btn-error' : 'btn-primary'}`}
            style={{ width: '100%', padding: '1rem', justifyContent: 'center', fontSize: '1rem' }}
            backgroundColor={checkedIn ? '#fee2e2' : 'var(--primary)'}
          >
            {checkedIn ? 'Stop Session & Check-out' : 'Start Session & Check-in'}
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ActivityItem icon={<CheckCircle color="var(--success)" />} title="Checked In" time="09:00 AM" />
            <ActivityItem icon={<Calendar color="var(--primary)" />} title="Applied for Leave" time="Yesterday" />
            <ActivityItem icon={<XCircle color="var(--error)" />} title="Timesheet Rejected" time="2 days ago" />
          </div>
        </div>
      </div>

      {checkingIn && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
            <h2 style={{ marginBottom: '1rem' }}>Verify Identity</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Please look at the camera to check-in.</p>
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={captureAndCheckIn}
                className="btn btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Camera size={20} /> Capture & Check-in
              </button>
              <button 
                onClick={() => setCheckingIn(false)}
                className="btn btn-ghost" 
                style={{ flex: 1, justifyContent: 'center' }}
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

const ActivityItem = ({ icon, title, time }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: '#f8fafc' }}>
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      {icon}
      <span style={{ fontWeight: 500 }}>{title}</span>
    </div>
    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{time}</span>
  </div>
);

export default EmployeeDashboard;
