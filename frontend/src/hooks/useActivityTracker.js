import { useEffect, useRef } from 'react';
import api from '../services/api';

const IDLE_TIME = 5 * 1000; // 5 seconds for testing
const AWAY_TIME = 10 * 1000; // 10 seconds for testing
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds heartbeat for testing

export default function useActivityTracker(user) {
  const lastActivity = useRef(Date.now());
  const currentStatus = useRef('active');

  useEffect(() => {
    if (!user) return;

    const updateStatus = async (status) => {
      // Manual statuses that should NOT be overridden by auto-tracking
      const manualStatuses = ['teaBreak', 'meeting', 'lunchBreak', 'onLeave'];
      if (manualStatuses.includes(user.status) && status === 'active') return;
      if (currentStatus.current === status && status === 'active') return; 
      
      try {
        await api.post('/activity/heartbeat', { status });
        currentStatus.current = status;
      } catch (err) {
        console.error('Failed to sync activity status', err);
      }
    };

    const handleUserActivity = () => {
      const now = Date.now();
      lastActivity.current = now;
      
      if (currentStatus.current !== 'active') {
        updateStatus('active');
      }
    };

    const checkInactivity = () => {
      const manualStatuses = ['teaBreak', 'meeting', 'lunchBreak', 'onLeave'];
      if (manualStatuses.includes(user.status)) return;

      const now = Date.now();
      const diff = now - lastActivity.current;

      let newStatus = 'active';
      if (diff >= AWAY_TIME) {
        newStatus = 'away';
      } else if (diff >= IDLE_TIME) {
        newStatus = 'idle';
      }

      if (newStatus !== currentStatus.current) {
        updateStatus(newStatus);
      }
    };

    // Events to track
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Heartbeat & Checker
    const heartbeatTimer = setInterval(() => {
        if (currentStatus.current === 'active') {
            updateStatus('active');
        }
    }, HEARTBEAT_INTERVAL);

    const checkTimer = setInterval(checkInactivity, 2000); // Check every 2 seconds for FAST testing

    // Initial status sync
    updateStatus('active');

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(heartbeatTimer);
      clearInterval(checkTimer);
    };
  }, [user]);
}
