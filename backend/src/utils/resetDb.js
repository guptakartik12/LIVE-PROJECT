const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const seedInitialData = require('./seedData');

const runReset = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Resetting and re-seeding database...');
    await seedInitialData(true);
    console.log('✅ Database successfully reset to factory default!');
    process.exit(0);
  } catch (err) {
    console.error('Reset error:', err);
    process.exit(1);
  }
};

runReset();

