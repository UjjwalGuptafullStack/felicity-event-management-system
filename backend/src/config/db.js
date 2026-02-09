const mongoose = require('mongoose');

/**
 * Connect to MongoDB using URI from environment variables
 * Exits process if connection fails
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+
      // but can be included for backwards compatibility
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
