import React from 'react';
import { useAuth } from '../context/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import MySpace from './MySpace';

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'SuperAdmin': return <SuperAdminDashboard />;
    case 'HR':
    case 'Manager':
    case 'Employee': return <MySpace />;
    default: return <div>Unauthorized</div>;
  }
};

export default Dashboard;
