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

    const targetEmail = config.admin.email.toLowerCase();

    // Check if the target admin already exists
    const existingAdmin = await User.findOne({
      email: targetEmail,
      role: USER_ROLES.ADMIN
    });

    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      
      // Remove any other admin accounts (ensure only one admin)
      const otherAdmins = await User.find({
        email: { $ne: targetEmail },
        role: USER_ROLES.ADMIN
      });

      if (otherAdmins.length > 0) {
        await User.deleteMany({
          email: { $ne: targetEmail },
          role: USER_ROLES.ADMIN
        });
        console.log(`✓ Removed ${otherAdmins.length} unauthorized admin account(s)`);
      }
      
      return;
    }

    // Remove any existing admin accounts with different emails
    const allAdmins = await User.find({ role: USER_ROLES.ADMIN });
    if (allAdmins.length > 0) {
      await User.deleteMany({ role: USER_ROLES.ADMIN });
      console.log(`✓ Removed ${allAdmins.length} unauthorized admin account(s)`);
    }

    // Create the only valid admin user
    const passwordHash = await hashPassword(config.admin.password);

    const admin = new User({
      firstName: config.admin.firstName,
      lastName: config.admin.lastName,
      email: targetEmail,
      passwordHash,
      role: USER_ROLES.ADMIN,
      participantType: null // Admin is not a participant
    });

    await admin.save();

    console.log('✓ Admin user created successfully');
    console.log(`  Email: ${config.admin.email}`);
    console.log('  ⚠ This is the only valid admin account');
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
