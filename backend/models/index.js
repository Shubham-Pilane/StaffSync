const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Company = sequelize.define('Company', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true,
    validate: { isEmail: true }
  },
  status: { 
    type: DataTypes.ENUM('active', 'disabled', 'suspended'), 
    defaultValue: 'active' 
  },
  subscriptionPlan: { type: DataTypes.STRING, defaultValue: 'basic' }
});

const User = sequelize.define('User', {
  name:       { type: DataTypes.STRING, allowNull: false },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true,
    validate: { isEmail: true }
  },
  password:   { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('SuperAdmin', 'HR', 'Manager', 'Employee'), 
    allowNull: false 
  },
  department:  { type: DataTypes.STRING },
  salary:      { type: DataTypes.DECIMAL(10, 2) },
  managerId:   { type: DataTypes.INTEGER, allowNull: true },
  companyId:   { type: DataTypes.INTEGER, allowNull: true }
});

const Attendance = sequelize.define('Attendance', {
  checkIn: { type: DataTypes.DATE, allowNull: false },
  checkOut: { type: DataTypes.DATE },
  totalHours: { type: DataTypes.FLOAT },
  selfiePath: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING }
});

const Leave = sequelize.define('Leave', {
  type: { type: DataTypes.STRING, allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  reason: { type: DataTypes.TEXT },
  status: { 
    type: DataTypes.ENUM('pending', 'approved', 'rejected'), 
    defaultValue: 'pending' 
  },
  managerComment: { type: DataTypes.TEXT }
});

const Timesheet = sequelize.define('Timesheet', {
  date:           { type: DataTypes.DATEONLY, allowNull: false },
  totalHours:     { type: DataTypes.FLOAT, allowNull: false },
  description:    { type: DataTypes.TEXT },
  projectName:    { type: DataTypes.STRING },
  jobName:        { type: DataTypes.STRING },
  workItem:       { type: DataTypes.STRING },
  billableStatus: { type: DataTypes.STRING, defaultValue: 'Billable' },
  startTime:      { type: DataTypes.STRING },
  endTime:        { type: DataTypes.STRING },
  status: { 
    type: DataTypes.ENUM('pending', 'approved', 'rejected'), 
    defaultValue: 'pending' 
  },
  managerComment: { type: DataTypes.TEXT }
});

// Associations
Company.hasMany(User, { foreignKey: 'companyId' });
User.belongsTo(Company, { foreignKey: 'companyId' });

User.belongsTo(User, { as: 'Manager', foreignKey: 'managerId' });
User.hasMany(User, { as: 'Subordinates', foreignKey: 'managerId' });

User.hasMany(Attendance, { foreignKey: 'userId' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Leave, { foreignKey: 'userId' });
Leave.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Leave, { as: 'ManagedLeaves', foreignKey: 'managerId' });
Leave.belongsTo(User, { as: 'Approver', foreignKey: 'managerId' });

User.hasMany(Timesheet, { foreignKey: 'userId' });
Timesheet.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Timesheet, { as: 'ManagedTimesheets', foreignKey: 'managerId' });
Timesheet.belongsTo(User, { as: 'Approver', foreignKey: 'managerId' });

module.exports = { sequelize, Company, User, Attendance, Leave, Timesheet };
