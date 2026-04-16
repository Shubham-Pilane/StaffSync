const { User, Company } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
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
      companyId: req.user.companyId
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
