const { User, Company, Leave, StatusLog } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: User, as: 'Manager', attributes: ['name', 'department', 'status'] }]
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ 
      where: { email },
      include: [Company]
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.Company && user.Company.status !== 'active') {
      return res.status(403).json({ error: 'Company account is ' + user.Company.status });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        companyId: user.companyId,
        department: user.department,
        managerId: user.managerId 
      },
      process.env.JWT_SECRET
    );
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addEmployee = async (req, res) => {
  try {
    const { name, email, role, department, managerId, password } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'password123', 8);
    console.log('Adding employee with data:', { name, email, role, department, managerId });
    
    // Explicitly parse or nullify
    const processedManagerId = (managerId && managerId !== "" && managerId !== "null") ? parseInt(managerId) : null;

    const employee = await User.create({
      name,
      email,
      role,
      department,
      managerId: processedManagerId,
      password: hashedPassword,
      companyId: req.user.companyId,
      status: 'offline'
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { companyId: req.user.companyId },
      include: [{ as: 'Manager', model: User, attributes: ['name'] }]
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getManagers = async (req, res) => {
  try {
    const managers = await User.findAll({
      where: { 
        companyId: req.user.companyId, 
        role: ['Manager', 'HR'] 
      }
    });
    res.json(managers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateActivityStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;
    const newStatus = status || 'active';

    // Get current user to check if status is changing
    const user = await User.findByPk(userId);
    
    if (user && user.status !== newStatus) {
      const now = new Date();
      
      // Close existing open log if any
      const openLog = await StatusLog.findOne({
        where: { userId, endTime: null },
        order: [['startTime', 'DESC']]
      });

      if (openLog) {
        const duration = now - openLog.startTime;
        await openLog.update({
          endTime: now,
          durationMs: duration
        });
      }

      // Start new log
      await StatusLog.create({
        userId,
        status: newStatus,
        startTime: now
      });
    }

    await User.update(
      { status: newStatus, lastActivityAt: new Date() },
      { where: { id: userId } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getSubordinateStatuses = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const subordinates = await User.findAll({
      where: { managerId: req.user.id },
      attributes: ['id', 'name', 'email', 'department', 'status', 'lastActivityAt']
    });

    // Check for today's approved leaves for these subordinates
    const memberIds = subordinates.map(s => s.id);
    const leavesToday = await Leave.findAll({
      where: {
        userId: memberIds,
        status: 'approved',
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today }
      }
    });

    const leaveUserIds = new Set(leavesToday.map(l => l.userId));

    // Map the status
    const dynamicSubordinates = subordinates.map(s => {
      const data = s.toJSON();
      if (leaveUserIds.has(s.id)) {
        data.status = 'onLeave';
      }
      return data;
    });

    res.json(dynamicSubordinates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
