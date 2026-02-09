/**
 * Environment configuration
 * Loads and validates environment variables
 */

require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity-events',

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '7d',

  // Bcrypt
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,

  // Email validation
  iiitEmailDomain: process.env.IIIT_EMAIL_DOMAIN || '@iiit.ac.in',

  // Admin bootstrap
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    firstName: process.env.ADMIN_FIRST_NAME || 'System',
    lastName: process.env.ADMIN_LAST_NAME || 'Administrator'
  }
};

// Validate critical config
if (!config.jwtSecret) {
  console.error('FATAL: JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

if (config.bcryptRounds < 10) {
  console.warn('WARNING: BCRYPT_ROUNDS is below recommended minimum of 10');
}

if (!config.admin.email || !config.admin.password) {
  console.warn('WARNING: Admin credentials not configured. Bootstrap will be skipped.');
}

module.exports = config;
