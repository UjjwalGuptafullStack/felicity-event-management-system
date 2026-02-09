/**
 * System Bootstrap Utilities
 * 
 * Handles one-time system initialization tasks:
 * - Admin user creation
 * 
 * CRITICAL: These functions run at server startup, not via API
 */

const User = require('../models/User');
const { USER_ROLES } = require('./constants');
const { hashPassword } = require('./authHelpers');
const config = require('../config/env');

/**
 * Bootstrap admin user
 * 
 * Purpose:
 * - Ensures exactly one admin exists in the system
 * - Creates admin if not found
 * - Uses credentials from environment variables
 * 
 * Why at startup:
 * - Admin must exist before any operations
 * - No public API should create admin (security risk)
 * - Idempotent (safe to run multiple times)
 * 
 * @returns {Promise<void>}
 */
const bootstrapAdmin = async () => {
  try {
    // Check if admin credentials are configured
    if (!config.admin.email || !config.admin.password) {
      console.log('⚠ Admin bootstrap skipped: credentials not configured in .env');
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: config.admin.email.toLowerCase(),
      role: USER_ROLES.ADMIN
    });

    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      return;
    }

    // Create admin user
    const passwordHash = await hashPassword(config.admin.password);

    const admin = new User({
      firstName: config.admin.firstName,
      lastName: config.admin.lastName,
      email: config.admin.email.toLowerCase(),
      passwordHash,
      role: USER_ROLES.ADMIN,
      participantType: null // Admin is not a participant
    });

    await admin.save();

    console.log('✓ Admin user created successfully');
    console.log(`  Email: ${config.admin.email}`);
    console.log('  ⚠ Change password after first login');
  } catch (error) {
    console.error('✗ Admin bootstrap failed:', error.message);
    // Don't exit - let server start but log error
  }
};

/**
 * Run all bootstrap tasks
 * 
 * Called once at server startup after DB connection
 * 
 * @returns {Promise<void>}
 */
const runBootstrap = async () => {
  console.log('\n--- System Bootstrap ---');
  await bootstrapAdmin();
  console.log('--- Bootstrap Complete ---\n');
};

module.exports = {
  runBootstrap,
  bootstrapAdmin
};
