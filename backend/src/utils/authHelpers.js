/**
 * Authentication helper utilities
 * Defines JWT payload structures and token generation/validation contracts
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/env');
const { ACTOR_TYPES } = require('./constants');

/**
 * Create JWT payload for User-based actors (Participant/Admin)
 * @param {Object} user - User document from database
 * @returns {Object} JWT payload with actorType and role
 */
const createUserPayload = (user) => {
  return {
    id: user._id.toString(),
    actorType: ACTOR_TYPES.USER,
    role: user.role
  };
};

/**
 * Create JWT payload for Organizer actors
 * @param {Object} organizer - Organizer document from database
 * @returns {Object} JWT payload with actorType (no role field)
 */
const createOrganizerPayload = (organizer) => {
  return {
    id: organizer._id.toString(),
    actorType: ACTOR_TYPES.ORGANIZER
    // Note: No role field - organizer status is implicit
  };
};

/**
 * Validate actor payload structure
 * @param {Object} payload - Decoded JWT payload
 * @returns {boolean} True if payload is valid
 */
const isValidPayload = (payload) => {
  if (!payload || !payload.id || !payload.actorType) {
    return false;
  }

  // User actors must have a role
  if (payload.actorType === ACTOR_TYPES.USER && !payload.role) {
    return false;
  }

  // Organizer actors must NOT have a role
  if (payload.actorType === ACTOR_TYPES.ORGANIZER && payload.role) {
    return false;
  }

  return true;
};

/**
 * Check if payload represents a user actor
 * @param {Object} payload - Decoded JWT payload
 * @returns {boolean}
 */
const isUserActor = (payload) => {
  return payload && payload.actorType === ACTOR_TYPES.USER;
};

/**
 * Check if payload represents an organizer actor
 * @param {Object} payload - Decoded JWT payload
 * @returns {boolean}
 */
const isOrganizerActor = (payload) => {
  return payload && payload.actorType === ACTOR_TYPES.ORGANIZER;
};

/**
 * Check if payload represents an admin user
 * @param {Object} payload - Decoded JWT payload
 * @returns {boolean}
 */
const isAdmin = (payload) => {
  const { USER_ROLES } = require('./constants');
  return isUserActor(payload) && payload.role === USER_ROLES.ADMIN;
};

/**
 * Check if payload represents a participant user
 * @param {Object} payload - Decoded JWT payload
 * @returns {boolean}
 */
const isParticipant = (payload) => {
  const { USER_ROLES } = require('./constants');
  return isUserActor(payload) && payload.role === USER_ROLES.PARTICIPANT;
};

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, config.bcryptRounds);
};

/**
 * Compare plain text password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token from payload
 * @param {Object} payload - Token payload (id, actorType, role?)
 * @returns {string} Signed JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiry
  });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

/**
 * Validate email belongs to IIIT participant domains.
 * Accepted:
 *   @students.iiit.ac.in   — student accounts
 *   @research.iiit.ac.in   — research scholars
 *   @iiit.ac.in            — faculty / staff
 *   *.iiit.ac.in           — any IIIT sub-domain
 * @param {string} email - Email to validate
 * @returns {boolean} True if IIIT email
 */
const isIIITEmail = (email) => {
  const emailLower = email.toLowerCase();
  // Match any sub-domain of iiit.ac.in (includes students., research., faculty., etc.)
  return emailLower.endsWith('@iiit.ac.in') || emailLower.endsWith('.iiit.ac.in');
};

module.exports = {
  createUserPayload,
  createOrganizerPayload,
  isValidPayload,
  isUserActor,
  isOrganizerActor,
  isAdmin,
  isParticipant,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  isIIITEmail
};
