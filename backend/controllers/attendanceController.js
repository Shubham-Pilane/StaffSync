const { Attendance } = require('../models');

exports.checkIn = async (req, res) => {
  try {
    const selfiePath = req.file ? req.file.path : null;
    if (!selfiePath) return res.status(400).json({ error: 'Selfie is required for check-in' });

    // Prevent duplicate check-ins
    const existing = await Attendance.findOne({
      where: { userId: req.user.id, checkOut: null }
    });
    if (existing) {
      return res.status(400).json({ error: 'You are already checked in. Please check out first.' });
    }

    const attendance = await Attendance.create({
      userId: req.user.id,
      checkIn: new Date(),
      selfiePath,
      location: req.body.location
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      where: { userId: req.user.id, checkOut: null },
      order: [['checkIn', 'DESC']]
    });

    if (!attendance) return res.status(404).json({ error: 'No active check-in found' });

    attendance.checkOut = new Date();
    const duration = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60); // in hours
    attendance.totalHours = parseFloat(duration.toFixed(2));
    await attendance.save();

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    const history = await Attendance.findAll({
      where: { userId: req.user.id },
      order: [['checkIn', 'DESC']]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
