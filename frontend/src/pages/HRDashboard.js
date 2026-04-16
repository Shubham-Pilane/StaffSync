import React, { useState, useEffect } from 'react';
import { Users, UserPlus, FileText, CheckCircle } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

const HRDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', role: 'Employee', department: '', managerId: '' });
  const [managers, setManagers] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchManagers = async () => {
    try {
      const res = await api.get('/managers');
      setManagers(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', newEmp);
      setShowAddModal(false);
      fetchEmployees();
      setNotification({ message: 'Employee onboarded successfully!', type: 'success' });
    } catch (err) { 
      setNotification({ message: err.response?.data?.error || 'Failed to onboard employee', type: 'error' });
    }
  };

  return (
    <div>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Company Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your team and hierarchy</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <UserPlus size={20} /> Add Employee
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <SummaryCard label="Total Employees" value={employees.length} icon={<Users />} color="#6366f1" />
        <SummaryCard label="Pending Leves" value="12" icon={<FileText />} color="#f59e0b" />
        <SummaryCard label="Today's Attendance" value="85%" icon={<CheckCircle />} color="#10b981" />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Employee List</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Manager</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 600 }}>{emp.name}<br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</span></td>
                  <td>{emp.role}</td>
                  <td>{emp.department}</td>
                  <td>{emp.Manager?.name || 'N/A'}</td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-solid animate-fade" style={{ width: '100%', maxWidth: '540px' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem', color: '#1e293b' }}>Onboard New Employee</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontWeight: 500 }}>Add a new member to your organization's workforce.</p>
            <form onSubmit={handleAddEmployee}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Personal Information</label>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <input className="input" placeholder="Full Name" style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                    onChange={e => setNewEmp({...newEmp, name: e.target.value})} required />
                  <input type="email" className="input" placeholder="Work Email Address" style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                    onChange={e => setNewEmp({...newEmp, email: e.target.value})} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Designation</label>
                  <select style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                    onChange={e => setNewEmp({...newEmp, role: e.target.value})}>
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Department</label>
                  <input className="input" placeholder="e.g. Engineering" style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                    onChange={e => setNewEmp({...newEmp, department: e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Reporting Manager</label>
                <select style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                  onChange={e => setNewEmp({...newEmp, managerId: e.target.value})} required>
                  <option value="">Select a manager...</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.department || 'No Dept'})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5, justifyContent: 'center', borderRadius: '14px', padding: '1rem' }}>Onboard Employee</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', borderRadius: '14px', background: '#f1f5f9', color: '#475569' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, icon, color }) => (
  <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{label}</p>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</h3>
      </div>
      <div style={{ color }}>{React.cloneElement(icon, { size: 20 })}</div>
    </div>
  </div>
);

export default HRDashboard;
