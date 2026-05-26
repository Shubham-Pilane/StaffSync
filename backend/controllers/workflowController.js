const { Leave, Timesheet, User, Holiday, Project } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

// Leave Controllers
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    // Also fetch current user's leave limits
    const user = await User.findByPk(req.user.id, {
      attributes: ['annualLeaveLimit', 'sickLeaveLimit', 'casualLeaveLimit']
    });

    res.json({ leaves, limits: user || { annualLeaveLimit: 18, sickLeaveLimit: 12, casualLeaveLimit: 6 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const leave = await Leave.create({
      userId: req.user.id,
      managerId: req.user.managerId,
      type,
      startDate,
      endDate,
      reason
    });
    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPendingLeaves = async (req, res) => {
  try {
    const { status } = req.query; // Add support for status filter
    const whereClause = { managerId: req.user.id };
    if (status) {
        whereClause.status = status;
    }
    const leaves = await Leave.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['name', 'email', 'department'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerComment } = req.body;
    const leave = await Leave.findOne({ where: { id, managerId: req.user.id } });
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    leave.status = status;
    if (managerComment !== undefined) {
      leave.managerComment = managerComment;
    }
    await leave.save();

    // Send email notification
    try {
      const employee = await User.findByPk(leave.userId);
      if (employee && employee.email) {
        await emailService.sendStatusNotification({
          to: employee.email,
          employeeName: employee.name,
          type: 'Leave',
          status: leave.status,
          managerComment: leave.managerComment,
          details: `${leave.type} (${leave.startDate} to ${leave.endDate})`
        });
      }
    } catch (emailError) {
      console.error('Failed to send leave status email:', emailError);
    }

    res.json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Timesheet Controllers
exports.getMyTimesheets = async (req, res) => {
  try {
    const timesheets = await Timesheet.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });
    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitTimesheet = async (req, res) => {
  try {
    const { date, totalHours, description, projectName, jobName, workItem, billableStatus, startTime, endTime } = req.body;
    const timesheet = await Timesheet.create({
      userId: req.user.id,
      managerId: req.user.managerId,
      date,
      totalHours,
      description,
      projectName,
      jobName,
      workItem,
      billableStatus,
      startTime,
      endTime
    });
    res.status(201).json(timesheet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPendingTimesheets = async (req, res) => {
  try {
    const { status } = req.query; // Add support for status filter
    const whereClause = { managerId: req.user.id };
    if (status) {
        whereClause.status = status;
    }
    const timesheets = await Timesheet.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['name', 'department'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTimesheetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerComment } = req.body;
    const timesheet = await Timesheet.findOne({ where: { id, managerId: req.user.id } });
    if (!timesheet) return res.status(404).json({ error: 'Timesheet not found' });

    timesheet.status = status;
    if (managerComment !== undefined) {
      timesheet.managerComment = managerComment;
    }
    await timesheet.save();

    // Send email notification
    try {
      const employee = await User.findByPk(timesheet.userId);
      if (employee && employee.email) {
        await emailService.sendStatusNotification({
          to: employee.email,
          employeeName: employee.name,
          type: 'Timesheet',
          status: timesheet.status,
          managerComment: timesheet.managerComment,
          details: `${timesheet.totalHours} hours worked on ${timesheet.date}${timesheet.projectName ? ` for ${timesheet.projectName}` : ''}`
        });
      }
    } catch (emailError) {
      console.error('Failed to send timesheet status email:', emailError);
    }

    res.json(timesheet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.bulkApproveReject = async (req, res) => {
  try {
    const { ids, status, managerComment } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid IDs' });

    await Timesheet.update(
      { status, managerComment },
      { 
        where: { 
          id: ids,
          managerId: req.user.id
        } 
      }
    );

    // Send emails (Simplified for batch)
    const firstTs = await Timesheet.findByPk(ids[0], { include: [User] });
    if (firstTs && firstTs.User && firstTs.User.email) {
      emailService.sendStatusNotification({
        to: firstTs.User.email,
        employeeName: firstTs.User.name,
        type: 'Timesheet (Batch)',
        status,
        managerComment,
        details: `Batch update for ${ids.length} logs.`
      }).catch(err => console.error('Email failed:', err));
    }

    res.json({ message: `Successfully ${status} ${ids.length} logs.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitDraftTimesheets = async (req, res) => {
  try {
    const [updatedCount] = await Timesheet.update(
      { status: 'pending' },
      { 
        where: { 
          userId: req.user.id,
          status: 'draft'
        } 
      }
    );
    res.json({ message: `${updatedCount} timesheets submitted for approval.`, updatedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Holiday Controllers
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.findAll({
      where: { companyId: req.user.companyId },
      order: [['date', 'ASC']]
    });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const { name, date } = req.body;
    const holiday = await Holiday.create({
      name,
      date,
      companyId: req.user.companyId
    });
    res.status(201).json(holiday);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findOne({ where: { id, companyId: req.user.companyId } });
    if (!holiday) return res.status(404).json({ error: 'Holiday not found' });
    await holiday.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// HR Direct Approved Leave Recording
exports.createHrLeave = async (req, res) => {
  try {
    const { userId, type, startDate, endDate, reason } = req.body;

    // Security verification to ensure employee belongs to the same company
    const employee = await User.findOne({ where: { id: userId, companyId: req.user.companyId } });
    if (!employee) {
      return res.status(403).json({ error: 'Access Denied: Employee does not belong to your company.' });
    }

    const leave = await Leave.create({
      userId,
      type,
      startDate,
      endDate,
      reason: reason || 'Added by HR',
      status: 'approved',
      managerId: req.user.id
    });
    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Approved Leaves for Company Calendar
exports.getCalendarLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { status: 'approved' },
      include: [{ model: User, attributes: ['name', 'companyId'] }]
    });
    const filteredLeaves = leaves.filter(l => l.User && l.User.companyId === req.user.companyId);
    res.json(filteredLeaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Project Controllers
exports.getProjects = async (req, res) => {
  try {
    if (req.user.role === 'Employee') {
      const projects = await Project.findAll({
        where: { companyId: req.user.companyId },
        include: [{
          model: User,
          as: 'Employees',
          where: { id: req.user.id },
          attributes: []
        }]
      });
      res.json(projects);
    } else {
      const projects = await Project.findAll({
        where: { companyId: req.user.companyId },
        include: [{
          model: User,
          as: 'Employees',
          attributes: ['id', 'name', 'email']
        }]
      });
      res.json(projects);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, jobName, assignedEmployeeIds } = req.body;
    const project = await Project.create({
      name,
      jobName,
      companyId: req.user.companyId,
      managerId: req.user.id
    });

    if (assignedEmployeeIds && assignedEmployeeIds.length > 0) {
      const employees = await User.findAll({
        where: {
          id: assignedEmployeeIds,
          companyId: req.user.companyId
        }
      });
      await project.setEmployees(employees);
    }

    const createdProject = await Project.findByPk(project.id, {
      include: [{
        model: User,
        as: 'Employees',
        attributes: ['id', 'name', 'email']
      }]
    });
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({
      where: { id, companyId: req.user.companyId }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
