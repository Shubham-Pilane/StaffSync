import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Filter, Edit, Trash } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEmp, setDeletingEmp] = useState({ id: null, name: '' });
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', role: 'Employee', department: '', managerId: null, password: '' });
  const [editingEmp, setEditingEmp] = useState({ id: null, name: '', email: '', role: 'Employee', department: '', managerId: null, password: '' });
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', newEmp);
      setShowAddModal(false);
      setNewEmp({ name: '', email: '', role: 'Employee', department: '', managerId: null, password: '' });
      fetchEmployees();
      fetchManagers();
      setNotification({ message: 'Employee successfully onboarded!', type: 'success' });
    } catch (err) { 
      setNotification({ message: err.response?.data?.error || 'Failed to onboard employee', type: 'error' });
    }
  };

  const handleOpenEditModal = (emp) => {
    fetchManagers();
    setEditingEmp({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      department: emp.department || '',
      managerId: emp.managerId || null,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${editingEmp.id}`, editingEmp);
      setShowEditModal(false);
      fetchEmployees();
      fetchManagers();
      setNotification({ message: 'Employee updated successfully!', type: 'success' });
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to update employee', type: 'error' });
    }
  };

  const handleDeleteEmployee = async () => {
    setLoadingDelete(true);
    try {
      await api.delete(`/employees/${deletingEmp.id}`);
      setShowDeleteModal(false);
      fetchEmployees();
      fetchManagers();
      setNotification({ message: 'Employee deleted successfully!', type: 'success' });
    } catch (err) {
      setNotification({ message: err.response?.data?.error || 'Failed to delete employee', type: 'error' });
    } finally {
      setLoadingDelete(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Employee Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your organization's talent and hierarchy</p>
        </div>
        <button onClick={() => { fetchManagers(); setShowAddModal(true); }} className="btn btn-primary">
          <UserPlus size={20} /> Onboard Employee
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email or department..." 
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 40px', border: '1px solid var(--border)', borderRadius: '8px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role & Dept</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Joined Date</th>
                {user?.role === 'HR' && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.75rem' }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{emp.role}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                  </td>
                  <td>{emp.Manager?.name || <span style={{ color: '#9ca3af' }}>No Manager</span>}</td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                  {user?.role === 'HR' && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleOpenEditModal(emp)} 
                          className="btn btn-ghost" 
                          style={{ padding: '0.4rem', border: '1px solid var(--border)', color: 'var(--primary)', borderRadius: '8px' }}
                          title="Edit Employee"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => { setDeletingEmp({ id: emp.id, name: emp.name }); setShowDeleteModal(true); }} 
                          className="btn btn-ghost" 
                          style={{ padding: '0.4rem', border: '1px solid var(--border)', color: 'var(--error)', borderRadius: '8px' }}
                          title="Delete Employee"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'HR' ? 6 : 5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} /><br/>
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', overflowY: 'auto'
        }}>
          <div className="modal-solid animate-fade" style={{ 
            width: '100%', 
            maxWidth: '540px',
            maxHeight: 'calc(100vh - 4rem)',
            overflowY: 'auto'
          }}>
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
                    onChange={e => {
                      const role = e.target.value;
                      setNewEmp({
                        ...newEmp, 
                        role, 
                        managerId: role === 'Employee' ? newEmp.managerId : null 
                      });
                    }}>
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Initial Password</label>
                  <input type="password" className="input" placeholder="••••••••" style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                    onChange={e => setNewEmp({...newEmp, password: e.target.value})} required />
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Department</label>
                <input className="input" placeholder="e.g. Engineering" style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                  onChange={e => setNewEmp({...newEmp, department: e.target.value})} />
              </div>
              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>
                  Reporting Manager
                  {newEmp.role !== 'Employee' && (
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '6px', fontSize: '0.8rem' }}>(Optional)</span>
                  )}
                </label>
                <select style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                  onChange={e => setNewEmp({...newEmp, managerId: e.target.value === "" ? null : e.target.value})}
                  required={newEmp.role === 'Employee'}>
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

      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', overflowY: 'auto'
        }}>
          <div className="modal-solid animate-fade" style={{ 
            width: '100%', 
            maxWidth: '540px',
            maxHeight: 'calc(100vh - 4rem)',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem', color: '#1e293b' }}>Edit Employee Details</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontWeight: 500 }}>Update information and reporting manager for this employee.</p>
            <form onSubmit={handleEditEmployee}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Personal Information</label>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <input className="input" placeholder="Full Name" style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                    value={editingEmp.name}
                    onChange={e => setEditingEmp({...editingEmp, name: e.target.value})} required />
                  <input type="email" className="input" placeholder="Work Email Address" style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                    value={editingEmp.email}
                    onChange={e => setEditingEmp({...editingEmp, email: e.target.value})} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Designation</label>
                  <select 
                    style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                    value={editingEmp.role}
                    onChange={e => {
                      const role = e.target.value;
                      setEditingEmp({
                        ...editingEmp, 
                        role, 
                        managerId: role === 'Employee' ? editingEmp.managerId : null 
                      });
                    }}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>
                    New Password <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(Optional)</span>
                  </label>
                  <input type="password" className="input" placeholder="Leave blank to keep current" style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                    value={editingEmp.password}
                    onChange={e => setEditingEmp({...editingEmp, password: e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Department</label>
                <input className="input" placeholder="e.g. Engineering" style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                  value={editingEmp.department}
                  onChange={e => setEditingEmp({...editingEmp, department: e.target.value})} />
              </div>
              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>
                  Reporting Manager
                  {editingEmp.role !== 'Employee' && (
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '6px', fontSize: '0.8rem' }}>(Optional)</span>
                  )}
                </label>
                <select 
                  style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white' }}
                  value={editingEmp.managerId || ""}
                  onChange={e => setEditingEmp({...editingEmp, managerId: e.target.value === "" ? null : e.target.value})}
                  required={editingEmp.role === 'Employee'}
                >
                  <option value="">Select a manager...</option>
                  {managers
                    .filter(m => String(m.id) !== String(editingEmp.id)) // Prevents self-reference
                    .map(m => <option key={m.id} value={m.id}>{m.name} ({m.department || 'No Dept'})</option>)
                  }
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5, justifyContent: 'center', borderRadius: '14px', padding: '1rem' }}>Save Changes</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', borderRadius: '14px', background: '#f1f5f9', color: '#475569' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', overflowY: 'auto'
        }}>
          <div className="modal-solid animate-fade" style={{ 
            width: '100%', 
            maxWidth: '480px',
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
            }}>
              <Trash size={32} />
            </div>
            
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem', color: '#1e293b' }}>
              Delete Employee
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontWeight: 500, lineHeight: 1.6 }}>
              Are you absolutely sure you want to permanently delete <strong>{deletingEmp.name}</strong> from the system?<br/>
              <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>This will also purge all their attendance logs, leaves, and timesheets. This action cannot be undone.</span>
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(false)} 
                className="btn btn-ghost" 
                style={{ flex: 1, justifyContent: 'center', borderRadius: '14px', background: '#f1f5f9', color: '#475569', padding: '0.85rem' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteEmployee} 
                disabled={loadingDelete}
                className="btn" 
                style={{ 
                  flex: 1.5, justifyContent: 'center', borderRadius: '14px', 
                  background: '#ef4444', color: 'white', border: 'none', padding: '0.85rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                {loadingDelete ? 'Deleting...' : 'Yes, Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
