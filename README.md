# StaffSync - Employee Management System

A premium, SaaS-based multi-tenant Employee Management System with role-based access control.

## 🚀 Getting Started

### Backend Setup
1. Open a terminal in the `backend` folder.
2. Run `npm install`.
3. Run `npm run seed` to initialize the database with a Super Admin.
4. Run `npm start` to start the API server on `http://localhost:5000`.

### Frontend Setup
1. Open a terminal in the `frontend` folder.
2. Run `npm install`.
3. Run `npm start` to start the React application.

## 🔐 Credentials
- **Super Admin**: `admin@staffsync.com` / `admin123`
- To create HR/Employees, login as Super Admin and onboard a company.

## ✨ Features
- **Multi-tenant Architecture**: Isolated data for different companies.
- **Webcam Attendance**: Capture a selfie on check-in for identity verification.
- **Workflow Approvals**: Employees apply for leaves/timesheets; Managers approve/reject.
- **Modern Dashboard**: Role-specific dashboards with analytics and charts.
- **Tech Stack**: React, Node.js, Express, Sequelize (SQLite for portability).

## 🛠️ Folder Structure
- `backend/`: API logic, models, controllers, and middleware.
- `frontend/`: React components, pages, and services.
- `backend/uploads/`: Stores selfie verification images.
