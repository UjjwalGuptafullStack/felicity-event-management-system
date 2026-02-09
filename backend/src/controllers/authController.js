/**
 * Authentication Controller
 * Handles registration and login for all actor types
 */

const User = require('../models/User');
const Organizer = require('../models/Organizer');
const { USER_ROLES, PARTICIPANT_TYPES } = require('../utils/constants');
const {
  hashPassword,
  comparePassword,
  generateToken,
  createUserPayload,
  createOrganizerPayload,
  isIIITEmail
} = require('../utils/authHelpers');

/**
 * Register a new participant
 * POST /auth/participant/register
 */
const registerParticipant = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      participantType,
      collegeOrOrg,
      contactNumber
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration data'
      });
    }

    // Determine participant type based on email if not provided
    let finalParticipantType = participantType;
    if (!finalParticipantType) {
      finalParticipantType = isIIITEmail(email) 
        ? PARTICIPANT_TYPES.IIIT 
        : PARTICIPANT_TYPES.NON_IIIT;
    }

    // Validate participantType matches email domain
    if (finalParticipantType === PARTICIPANT_TYPES.IIIT && !isIIITEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'IIIT participant type requires IIIT email domain'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      role: USER_ROLES.PARTICIPANT,
      participantType: finalParticipantType,
      collegeOrOrg,
      contactNumber
    });

    await user.save();

    // Generate token
    const payload = createUserPayload(user);
    const token = generateToken(payload);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

/**
 * Login participant
 * POST /auth/participant/login
 */
const loginParticipant = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: USER_ROLES.PARTICIPANT 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const payload = createUserPayload(user);
    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Login admin
 * POST /auth/admin/login
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: USER_ROLES.ADMIN 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const payload = createUserPayload(user);
    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Login organizer
 * POST /auth/organizer/login
 */
const loginOrganizer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find organizer
    const organizer = await Organizer.findOne({ 
      loginEmail: email.toLowerCase()
    });

    if (!organizer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if organizer is active
    if (!organizer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if organizer has password set
    if (!organizer.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, organizer.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const payload = createOrganizerPayload(organizer);
    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      message: 'Organizer login successful',
      token,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.loginEmail,
        category: organizer.category
      }
    });
  } catch (error) {
    console.error('Organizer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

module.exports = {
  registerParticipant,
  loginParticipant,
  loginAdmin,
  loginOrganizer
};
