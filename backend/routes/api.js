const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, checkRole } = require('../middleware/auth');

// Controllers
const companyController = require('../controllers/companyController');
const userController = require('../controllers/userController');
const attendanceController = require('../controllers/attendanceController');
const workflowController = require('../controllers/workflowController');

// Multer setup for selfies
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Public Routes
router.post('/login', userController.login);

// Super Admin Routes
router.post('/companies', auth, checkRole(['SuperAdmin']), companyController.createCompany);
router.get('/companies', auth, checkRole(['SuperAdmin']), companyController.getAllCompanies);
router.patch('/companies/:id/status', auth, checkRole(['SuperAdmin']), companyController.updateCompanyStatus);

// HR Routes
router.post('/employees', auth, checkRole(['HR']), userController.addEmployee);
router.get('/employees', auth, checkRole(['HR', 'Manager']), userController.getEmployees);
router.get('/managers', auth, checkRole(['HR', 'SuperAdmin']), userController.getManagers);

// Employee/Manager Routes (General)
router.post('/attendance/check-in', auth, upload.single('selfie'), attendanceController.checkIn);
router.post('/attendance/check-out', auth, attendanceController.checkOut);
router.get('/attendance/history', auth, attendanceController.getAttendanceHistory);

// Leave Routes
router.post('/leaves', auth, workflowController.applyLeave);
router.get('/leaves/my', auth, workflowController.getMyLeaves);
router.get('/leaves/pending', auth, checkRole(['Manager', 'HR']), workflowController.getPendingLeaves);
router.patch('/leaves/:id', auth, checkRole(['Manager', 'HR']), workflowController.updateLeaveStatus);
router.put('/companies/:id/status', auth, checkRole(['SuperAdmin']), companyController.updateCompanyStatus);

// Timesheet Routes
router.post('/timesheets', auth, workflowController.submitTimesheet);
router.get('/timesheets/my', auth, workflowController.getMyTimesheets);
router.get('/timesheets/pending', auth, checkRole(['Manager', 'HR']), workflowController.getPendingTimesheets);
router.patch('/timesheets/:id', auth, checkRole(['Manager', 'HR']), workflowController.updateTimesheetStatus);

module.exports = router;
