import React, { useState, useEffect } from 'react';
import { Hourglass, Search, Filter } from 'lucide-react';
import api from '../services/api';

const LeaveReports = () => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await api.get('/leaves/pending'); // For demo, fetching all pending/approved
        setLeaves(res.data);
      } catch (err) { console.error(err); }
    };
    fetchLeaves();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Leave Records</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor leave balances and requests across the company</p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.User?.name}</td>
                  <td>{l.type}</td>
                  <td>{l.startDate} to {l.endDate}</td>
                  <td>{l.reason}</td>
                  <td>
                    <span className={`badge badge-${l.status === 'pending' ? 'warning' : l.status === 'approved' ? 'success' : 'error'}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveReports;
