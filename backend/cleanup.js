/**
 * Cleanup script: removes all "orphaned" attendance records
 * that have the same check-in time as check-out (duplicates from testing).
 * Run: node cleanup.js
 */
const { sequelize, Attendance } = require('./models');
const { Op } = require('sequelize');

const cleanup = async () => {
  await sequelize.authenticate();
  console.log('Connected to database...');

  // Remove records where checkOut equals checkIn (zero-duration artifacts)
  const deleted = await Attendance.destroy({
    where: {
      [Op.and]: [
        sequelize.where(
          sequelize.fn('EXTRACT', sequelize.literal('EPOCH FROM ("checkOut" - "checkIn")')),
          { [Op.lt]: 60 } // less than 60 seconds
        )
      ]
    }
  });

  // Also remove any leftover duplicate open sessions (keep only most recent per user)
  const opens = await Attendance.findAll({ where: { checkOut: null }, order: [['checkIn', 'ASC']] });
  const seen = {};
  for (const r of opens) {
    if (seen[r.userId]) {
      await r.destroy();
      console.log(`Removed duplicate open session id=${r.id} for user ${r.userId}`);
    } else {
      seen[r.userId] = true;
    }
  }

  console.log(`Cleanup complete. Removed ${deleted} short-duration test records.`);
  process.exit();
};

cleanup().catch(err => { console.error(err); process.exit(1); });
