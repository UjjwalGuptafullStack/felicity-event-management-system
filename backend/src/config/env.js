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
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/convene-events',

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '7d',

  // Bcrypt
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,

  // Institution branding — used to label "affiliated" participants (e.g. students of a
  // specific college) versus the general public. Leave INSTITUTION_EMAIL_DOMAINS empty
  // to disable the affiliated/general distinction entirely.
  institutionName: process.env.INSTITUTION_NAME || 'Your Institution',
  institutionEmailDomains: (process.env.INSTITUTION_EMAIL_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),

  // Domain used for auto-generated organizer login emails (e.g. tech-club@<domain>)
  organizerEmailDomain: process.env.ORGANIZER_EMAIL_DOMAIN || 'clubs.convene.app',

  // Public app URL, used to build links in emails (e.g. password reset links)
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  // Admin bootstrap
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    firstName: process.env.ADMIN_FIRST_NAME || 'System',
    lastName: process.env.ADMIN_LAST_NAME || 'Administrator'
  },

  // Email (nodemailer SMTP)
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Convene <noreply@convene.app>'
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
