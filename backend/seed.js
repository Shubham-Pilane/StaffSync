const { sequelize, User, Company } = require('./models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  await sequelize.sync({ force: true }); // Reset DB

  const hashedPassword = await bcrypt.hash('admin123', 8);
  
  // Create Super Admin
  await User.create({
    name: 'Super Admin',
    email: 'admin@staffsync.com',
    password: hashedPassword,
    role: 'SuperAdmin'
  });

  console.log('Seed data created: admin@staffsync.com / admin123');
  process.exit();
};

seed();
