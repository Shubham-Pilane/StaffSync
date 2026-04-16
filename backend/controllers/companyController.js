const { Company, User } = require('../models');
const bcrypt = require('bcryptjs');

exports.createCompany = async (req, res) => {
  try {
    const { name, email, hrName, hrEmail, hrPassword } = req.body;
    
    // Create Company
    const company = await Company.create({ name, email });

    // Create HR Account
    const hashedPassword = await bcrypt.hash(hrPassword, 8);
    const hr = await User.create({
      name: hrName,
      email: hrEmail,
      password: hashedPassword,
      role: 'HR',
      companyId: company.id
    });

    res.status(201).json({ company, hr });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [{ model: User, where: { role: 'HR' }, limit: 1 }]
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const company = await Company.findByPk(id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    
    company.status = status;
    await company.save();
    res.json(company);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
