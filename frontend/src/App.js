import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Employees from './pages/Employees';
import AttendanceReports from './pages/AttendanceReports';
import LeaveReports from './pages/LeaveReports';
import Timesheets from './pages/Timesheets';
import Companies from './pages/Companies';
import Analytics from './pages/Analytics';
import LeaveApprovals from './pages/LeaveApprovals';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/attendance" element={<Layout><Attendance /></Layout>} />
          <Route path="/leaves" element={<Layout><Leaves /></Layout>} />
          
          {/* Super Admin specific routes */}
          <Route path="/companies" element={<Layout><Companies /></Layout>} />
          <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/employees" element={<Layout><Employees /></Layout>} />
          <Route path="/attendance-reports" element={<Layout><AttendanceReports /></Layout>} />
          <Route path="/leave-reports" element={<Layout><LeaveReports /></Layout>} />
          <Route path="/approvals/leaves" element={<Layout><Dashboard /></Layout>} />
          <Route path="/approvals/timesheets" element={<Layout><Dashboard /></Layout>} />
          <Route path="/timesheets" element={<Layout><Timesheets /></Layout>} />
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
