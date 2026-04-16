const { Leave, Timesheet, User } = require('../models');
const { Op } = require('sequelize');

// Leave Controllers
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(leaves);
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
    res.json(timesheet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
