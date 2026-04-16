import React, { useState, useEffect } from 'react';
import { Calendar, Search, Download } from 'lucide-react';
import api from '../services/api';

const AttendanceReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/employees'); // Get all employees
        // Mocking detailed reports for now or fetching from a potential bulk endpoint
        setReports(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchReports();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Attendance Reports</h1>
          <p style={{ color: 'var(--text-muted)' }}>View and audit daily attendance logs for all employees</p>
        </div>
        <button className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Total Hrs</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((emp, i) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{emp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                  </td>
                  <td><span className="badge badge-success">Present</span></td>
                  <td>09:00 AM</td>
                  <td>06:00 PM</td>
                  <td>9.0 hrs</td>
                  <td><span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}><CheckCircle size={12} /> Verified</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CheckCircle = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

export default AttendanceReports;
