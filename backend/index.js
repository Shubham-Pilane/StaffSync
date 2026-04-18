const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/', (req, res) => res.send('StaffSync API is running...'));

// Database Sync and Server Start
sequelize.sync({ alter: true }) // Auto-update tables
  .then(() => {
    console.log('Database connected and synced.');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

process.on('uncaughtException', (err) => {
  console.error('☢️ UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('☢️ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
