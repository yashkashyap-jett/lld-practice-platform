require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lld-platform';
  try {
    await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
