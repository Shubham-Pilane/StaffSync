require('dotenv').config();
const { sequelize } = require('./models');

sequelize.query('DELETE FROM "Attendances"')
  .then(() => {
    console.log('✅ All attendance records cleared.');
    process.exit();
  })
  .catch(e => {
    console.error(e.message);
    process.exit(1);
  });
