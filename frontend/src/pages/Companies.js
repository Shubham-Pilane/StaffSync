import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, MoreVertical, Shield, User, ExternalLink, Activity } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/companies/${id}/status`, { status });
      fetchCompanies();
      setNotification({ message: `Company status updated to ${status}`, type: 'success' });
    } catch (err) {
      setNotification({ message: 'Update failed', type: 'error' });
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {notification && <Toast {...notification} onClose={() => setNotification(null)} />}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Workspaces
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>Manage all registered organization tenants.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
          <input 
            type="text" 
            placeholder="Search by company name or corporate email..." 
            className="input"
            style={{ width: '100%', paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-ghost" style={{ border: '1px solid #e2e8f0', color: '#64748b' }}>
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>HR Administrator</th>
                <th>Status</th>
                <th>Staff Count</th>
                <th>Onboarded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(company => (
                <tr key={company.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', border: '1px solid #f1f5f9' }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{company.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{company.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {company.Users?.[0] ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ padding: '0.25rem', background: '#eef2ff', borderRadius: '4px', color: '#4f46e5' }}>
                          <Shield size={12} />
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{company.Users[0].name}</div>
                      </div>
                    ) : 'Not Setup'}
                  </td>
                  <td>
                    <span className={`badge badge-${company.status === 'active' ? 'success' : 'error'}`} style={{ textTransform: 'capitalize' }}>
                      {company.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: '#475569' }}>
                      <Activity size={14} color="#94a3b8" /> {company.employeeCount || 0} Employees
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(company.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <select 
                        style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600 }}
                        value={company.status}
                        onChange={(e) => handleStatusChange(company.id, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disable</option>
                        <option value="suspended">Suspend</option>
                      </select>
                      <button className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                        <MoreVertical size={18} color="#94a3b8" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    <Building2 size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 600 }}>No companies found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Companies;
