const { User } = require('./models');

async function checkSync() {
  const user = await User.findOne({ where: { email: 'shubhampilane143@gmail.com' } });
  if (!user) {
    console.log('USER NOT FOUND: shubhampilane143@gmail.com');
  } else {
    console.log('--- USER DATA ---');
    console.log('Name:', user.name);
    console.log('Manager ID:', user.managerId);
    console.log('Department:', user.department);
    
    if (user.managerId) {
      const mgr = await User.findByPk(user.managerId);
      console.log('--- LINKED MANAGER ---');
      console.log('Name:', mgr ? mgr.name : 'NOT FOUND');
      console.log('Role:', mgr ? mgr.role : 'N/A');
    }
    
    // Check if Sakshi exists
    const sakshi = await User.findOne({ where: { name: 'Sakshi' } });
    if (sakshi) {
       console.log('--- SAKSHI DATA ---');
       console.log('ID:', sakshi.id);
       console.log('Role:', sakshi.role);
    } else {
       console.log('Sakshi not found by name.');
    }
  }
  process.exit();
}

checkSync();
